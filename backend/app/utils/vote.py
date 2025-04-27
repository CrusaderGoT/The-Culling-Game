from typing import Sequence

from fastapi import HTTPException, status

from app.models.barrier import BarrierTech
from app.models.match import Match
from app.models.vote import Vote
from app.utils.dependencies import atp


def get_vote_point(
    match: Match,
    prev_votes: Sequence[Vote],
    player_bt: BarrierTech | None,
    opposing_player_bt: BarrierTech | None,
    atp: atp,
) -> float:
    "vote function for getting the vote point of a particular vote"

    vote_point = atp.vote_point
    unchanged_vote_point = atp.vote_point  # for use in adding of technique buff

    # 1. limit vote of player with an active binding vow to three, for as long as it is active
    if (
        player_bt
        and player_bt.binding_vow is True
        and len(prev_votes) >= (limit := atp.vote_binding_vow_limit)
    ):
        raise HTTPException(
            status.HTTP_425_TOO_EARLY,
            f"binding vow active, cannot vote more than {limit} times",
        )

    # 2. check if a player previously activated a binding vow that has paid off, in this match
    # then increment the vote_point, even if other BTs are active, except binding vow BT
    if (  # this confirms a player has a BT, then confirms that the/a BT has been used in this match
        player_bt
        and match.barrier_records
        # it then tries to get the acculamted binding vow points of the player, if any
        and (
            binded_vow := [
                br.binding_vow_counter
                for br in match.barrier_records
                if br.barrier_tech_id == player_bt.id
            ]
        )
        # finally checks that the player isn't currently under a binding vow
        and player_bt.binding_vow is False
    ):
        # ALL THESE CLAUSES MUST BE MET, HENCE THE 'and' OPERATORS.
        # increase vote_point by binding vow accumulated points
        vote_point += binded_vow[0]

    # 3. check if player 1 domain is activated
    if (  # confirm the player has a barrier technique
        player_bt
        # then confirm that their DE is active
        and player_bt.domain_expansion is True
    ):
        # Now check if opposing player has a barrier tech of their own
        if (
            opposing_player_bt
            # check if their simple domain is active
            and opposing_player_bt.simple_domain is True
        ):
            # players DE effect is reduced by half if so
            vote_point += (atp.domain_expansion_point * unchanged_vote_point) / 2
        else:  # opposing player doesn't have an activated simple domain
            vote_point += (
                atp.domain_expansion_point * unchanged_vote_point
            )  # increase vote points

    # 4. check if player 1 has a SD activated
    if player_bt and player_bt.simple_domain is True:
        # add simple domain points
        vote_point += atp.simple_domain_point * unchanged_vote_point

    # 5. Check if the opposing player has an active simple domain, outside of defending a DE
    if (  # check if opposing player has a barrier tech
        (
            opposing_player_bt
            # and their simple domain is activated
            and opposing_player_bt.simple_domain is True
        )
        and (  # player 1 DE isn't active (this confirms the opposing isn't defending a DE)
            player_bt
            # then confirm that their DE is false
            and player_bt.domain_expansion is False
        )
    ):
        # if opponents simple domain is active, reduce vote points
        vote_point -= unchanged_vote_point / atp.simple_domain_point

    # 6. else no Player 1 BT shenanigans
    else:
        vote_point = vote_point

    return round(vote_point, 1)
