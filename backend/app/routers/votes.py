from typing import Annotated

from app.auth.dependencies import active_user
from app.models.match import Match
from app.models.player import CTApp, CursedTechnique, Player
from app.models.user import User
from app.models.vote import CastVote, ClientVoteInfo, Vote
from app.utils.barrier import black_flash, fix_barrier_deactivation_task_fail
from app.utils.dependencies import atp, session
from app.utils.match import get_match, ongoing_match
from app.utils.vote import get_vote_point
from fastapi import APIRouter, Body, HTTPException, Path, status
from sqlmodel import select

# Create your API routes here
router = APIRouter()


@router.post("/vote/{match_id}", response_model=ClientVoteInfo)
async def vote(
    session: session,
    match_id: Annotated[int, Path()],
    voter: active_user,
    votes: Annotated[list[CastVote], Body(min_length=1, max_length=5)],
    atp: atp,
) -> ClientVoteInfo:
    """
    function for casting votes\n
    - a match id is required
    - if an invalid vote cursed application id or player id is submitted, they are ignored.
    """
    # first check if match exists
    match = get_match(session, match_id)
    if match is not None:
        # check if match still ongoing
        if ongoing_match(match) is True:
            # check if user has voted before, and get previous votes
            prev_votes = session.exec(
                select(Vote)
                .join(User)
                .join(Match)
                .where(Vote.match_id == match_id)
                .where(User.id == voter.id)
            ).all()
            if (
                vote_count := len(prev_votes)
            ) >= atp.vote_limit:  # if it has exceeded vote limt, no more votes
                raise HTTPException(
                    status.HTTP_423_LOCKED, f"{vote_count} votes limit reached"
                )
            else:
                # get the players fighting, and their ct apps, and store them in a dict
                fighters_dict = dict()
                for player_id, ct_app_id in session.exec(
                    select(Player.id, CTApp.id)
                    .join(Player.matches)  # type: ignore
                    .join(CursedTechnique)
                    .join(CTApp, CTApp.ct_id == CursedTechnique.id)  # type: ignore
                    .where(Match.id == match.id)
                ):
                    # Add ct_app_id to the corresponding player_id's list
                    if player_id not in fighters_dict and player_id is not None:
                        fighters_dict[player_id] = []
                    fighters_dict[player_id].append(ct_app_id)

                # check if no valid fighter/player
                if not fighters_dict:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST, "No valid players to vote for"
                    )

                # votes to be added and commited to session
                new_votes: list[Vote] = list()
                # message for player with binding vow limit
                extra_info: list[str] = list()
                # now iterate over the votes and cast them for correct player ct app
                for vote in votes:
                    # Check if the player_id exists and if the ct_app_id is in their list of ct_app_ids
                    if (
                        vote.player_id in fighters_dict
                        and vote.ct_app_id in fighters_dict[vote.player_id]
                    ):
                        # Check for duplicate votes
                        if vote.ct_app_id not in [
                            v.ct_app_id for v in new_votes
                        ] and vote.ct_app_id not in [v.ct_app_id for v in prev_votes]:
                            # Add points to the player, based on barrier techniques active
                            player = [
                                p for p in match.players if p.id == vote.player_id
                            ][0]
                            if player:
                                # get the opposing player, for their BT check against player
                                opposing_player = [
                                    p for p in match.players if p.id != player.id
                                ][0]

                                # deactivate any potential barrier end task fails
                                fix_barrier_deactivation_task_fail(
                                    player.barrier_technique, session
                                )

                                # get the vote point
                                vote_point = get_vote_point(
                                    match,
                                    prev_votes,
                                    player.barrier_technique,
                                    opposing_player.barrier_technique,
                                    atp,
                                )
                                # account for 0 vote_point, because of binding vows
                                if vote_point > 0:
                                    # try for black flash
                                    if black_flash(vote_point):
                                        vote_point *= atp.black_flash_point

                                    # Create and add the vote
                                    update_vote = {
                                        "user": voter,
                                        "match": match,
                                        "point": vote_point,
                                        "has_been_added": True,
                                    }
                                    casted_vote = Vote.model_validate(
                                        vote, update=update_vote
                                    )
                                    new_votes.append(casted_vote)
                                    # add the vote points to players points
                                    player.points = round(player.points + vote_point, 1)
                                else:
                                    extra_info.append(
                                        f"{player.name}'s binding vow vote limit reached."
                                    )

                else:  # runs after the loop
                    # make sure new votes will not exceed the 5 vote limit
                    expected_limit = atp.vote_limit - len(prev_votes)
                    real_limit = (
                        expected_limit if expected_limit > 0 else 0
                    )  # incase prev vote is > 5; i.e e_l results in a negative number
                    new_votes = new_votes[:real_limit]

                    # check if no new votes
                    if not new_votes:
                        raise HTTPException(
                            status.HTTP_406_NOT_ACCEPTABLE, "No valid vote was cast"
                        )

                    session.add_all(new_votes)
                    session.commit()  # this commit increases player points also
                    [session.refresh(v) for v in new_votes]
                    msg = f"{len(new_votes)} out of {len(votes)} was successful"
                    vote_info = {
                        "message": msg,
                        "votes": new_votes,
                        "extra_info": extra_info if extra_info else None,
                    }
                    info = ClientVoteInfo.model_validate(vote_info)
                    return info

        else:  # match has ended
            raise HTTPException(status.HTTP_423_LOCKED, detail="match has ended")
    else:  # match doesn't exist
        raise HTTPException(status.HTTP_404_NOT_FOUND, "match doesn't exist")
