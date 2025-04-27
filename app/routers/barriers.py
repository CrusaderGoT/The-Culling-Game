"""routers for barrier techniques"""

from datetime import UTC, datetime
from typing import Annotated

from app.auth.dependencies import active_user, oauth2_scheme
from app.models.barrier import BarrierTech, BarrierTechInfo
from app.models.match import Match
from app.models.player import Player
from app.utils.barrier import (
    activate_domain,
    activate_simple_domain,
    conditions_for_barrier_tech,
    deactivate_domain,
    deactivate_simple_domain,
    schedule_deactivate_domain,
    schedule_deactivate_simple_domain,
)
from app.utils.config import PlayerException, Tag
from app.utils.dependencies import atp, session
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Path,
    Query,
    status,
)

router = APIRouter(
    prefix="/barrier", tags=[Tag.barrier], dependencies=[Depends(oauth2_scheme)]
)


@router.post("/activate/domain/{player_id}", response_model=BarrierTechInfo)
def domain_expansion(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Query()],
    current_user: active_user,
    session: session,
    background: BackgroundTasks,
    atp: atp,
) -> BarrierTech:
    """Activates the domain of a player in an ongoing match.\n
    Buffs the vote to x4 per vote.\n
    Weakend by simple domain"""
    # first get the match, check if it is ongoing
    match = session.get(Match, match_id)
    player = session.get(Player, player_id)

    # get the condition necessary for a BT
    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player,
        match=match,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # check if player has an active simple domain active
    # and their grade is lower than special grade (i.e player_grade(0-4) >= special_grade(0))
    # then prevent activating domain expansion
    if barrier_tech.simple_domain is True and player.grade >= Player.Grade.SPECIAL:
        # check for pontential deactivate task fails
        if (end_time := barrier_tech.sd_end_time) is not None and datetime.now(
            UTC
        ) >= end_time:  # should have ended, but backgroud task failed
            # deactivate simple domain
            deactivate_simple_domain(barrier_tech, session)

        # simple domain is currently correctly active
        raise PlayerException(
            player=player,
            code=status.HTTP_409_CONFLICT,
            detail="you cannot activate domain expansion, "
            "because your simple domain is currently active. "
            "only players of grade 0 (special) can do this.",
        )

    # check if they have reach limit for domain expansion in a match
    if (
        barrier_record is not None
        and (count := barrier_record.domain_counter) >= atp.limit_domain_expansion
    ):
        # check for pontential deactivate task fails
        if (
            (
                (end_time := barrier_tech.de_end_time) is not None
                and datetime.now(UTC) >= end_time
            )
            or barrier_tech.domain_expansion is True
        ):  # should have ended, but backgroud task failed
            # deactivate domain
            deactivate_domain(barrier_tech, session)
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"domain can only be activated {count} times per match",
        )

    # checks if domain is currently already active
    elif (
        end_time := barrier_tech.de_end_time
    ) is not None and barrier_tech.domain_expansion is True:
        # if de end time has passed, that means that domain should have ended but the backgroud task failed
        if end_time and end_time <= datetime.now(
            UTC
        ):  # should have ended, but backgroud task failed
            barrier_tech = activate_domain(
                barrier_tech, barrier_record, match, session, atp
            )
            # schedule background task for deactivation
            background.add_task(schedule_deactivate_domain, barrier_tech, session)
            return barrier_tech
        else:  # active
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Domain is already active, deactivates in {
                    round(
                        (end_time - datetime.now(UTC)).total_seconds(),
                        1,
                    )
                } seconds.",
            )

    else:  # no domain activated or no deactivation time
        barrier_tech = activate_domain(
            barrier_tech, barrier_record, match, session, atp
        )
        # schedule background task for deactivation
        background.add_task(schedule_deactivate_domain, barrier_tech, session)
        return barrier_tech


@router.post("/activate/simple/{player_id}", response_model=BarrierTechInfo)
def simple_domain(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Query()],
    current_user: active_user,
    session: session,
    background: BackgroundTasks,
    atp: atp,
) -> BarrierTech:
    """
    \nActivates the simple domain effect for a player during an ongoing match. The simple domain interaction
    modifies the opponent's capabilities based on their current domain status:
        - If the opponent's domain expansion is inactive, it halves the effect of their opponent's votes per action.
        - If the domain expansion is active, it weakens its effect.\f
    \nParameters:
            player_id (int): Unique identifier for the player whose simple domain is being activated.
            match_id (int): The match identifier provided as a query parameter.
            current_user (active_user): The currently authenticated user executing the action.
            session (session): Database session for transactional operations and data retrieval.
            background (BackgroundTasks): Background task manager to schedule asynchronous deactivation.
            atp (atp): Configuration containing limitations, including limits on the number of activations
                                 per match for the simple domain.
    \nReturns:
            BarrierTech: An updated BarrierTech object reflecting the current state and timing details of
                                     the simple domain effect.
    \nRaises:
            HTTPException:
                    - If the player has already reached the activation limit for the simple domain in the match.
                    - If the simple domain is already active and the deactivation time has not passed.
    \nNotes:
            This function checks relevant conditions before activating the simple domain, including limits
            and current activation status. When appropriate, it schedules a background task to automatically
            deactivate the effect after its duration has elapsed.
    """
    match_none = session.get(Match, match_id)
    player = session.get(Player, player_id)

    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player,
        match=match_none,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # check if player has an active domain active
    # and prevent activating simple domain
    if barrier_tech.domain_expansion is True and player.grade >= Player.Grade.ONE:
        # check for potential DE end task fail
        if (end_time := barrier_tech.de_end_time) is not None and datetime.now(
            UTC
        ) >= end_time:
            deactivate_domain(barrier_tech, session)

        raise PlayerException(
            player=player,
            code=status.HTTP_409_CONFLICT,
            detail="you cannot activate simple domain, "
            "because your domain expansion is currently active. "
            "only players of grade 1 or higher can do this. "
            "try again later",
        )

    if (
        # check if they have a barrier record for the match.
        # and if they have not pass their limit for this technique / per match (barrier record)
        barrier_record is not None
        and (count := barrier_record.simple_domain_counter) >= atp.limit_simple_domain
    ):
        # limit has been passed
        # check if their expected properties are correct (endtime = None, simple_domain = False)
        # correct it if otherwise
        if (
            (end_time := barrier_tech.sd_end_time) is not None
            and datetime.now(UTC) >= end_time
            or barrier_tech.simple_domain is True
        ):  # should have ended, but backgroud task failed
            # deactivate simple domain
            deactivate_simple_domain(barrier_tech, session)

        # raise limit reach error
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"simple domain can only be activated {count} times per match",
        )

    elif (
        end_time := barrier_tech.sd_end_time
    ) is not None and barrier_tech.simple_domain is True:
        # has a barrier tech; check if simple domain is currently active
        # ? modify to accout for situations where one of them is True-ish/
        # also if sd end time has passed, that means that simple domain should have ended but the backgroud task failed
        if end_time <= datetime.now(
            UTC
        ):  # should have ended, but backgroud task failed; activate anyway
            barrier_tech = activate_simple_domain(
                barrier_tech, barrier_record, match, session, atp
            )
            # schedule background task for deactivation
            background.add_task(
                schedule_deactivate_simple_domain, barrier_tech, session
            )
            return barrier_tech
        else:  # active
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Simple Domain is already active, deactivates in {
                    round(
                        (end_time - datetime.now(UTC)).total_seconds(),
                        1,
                    )
                } seconds.",
            )

    else:  # no simple domain activated or no deactivation time
        barrier_tech = activate_simple_domain(
            barrier_tech, barrier_record, match, session, atp
        )
        # schedule background task for deactivation
        background.add_task(schedule_deactivate_simple_domain, barrier_tech, session)
        return barrier_tech


def bindind_vow(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Query()],
    current_user: active_user,
    session: session,
    background: BackgroundTasks,
    atp: atp,
):
    "activates a simple domain"
    match_none = session.get(Match, match_id)
    player = session.get(Player, player_id)

    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player,
        match=match_none,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )
