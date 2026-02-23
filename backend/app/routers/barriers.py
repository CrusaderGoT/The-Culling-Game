"""routers for barrier techniques"""

from datetime import UTC, datetime
from typing import Annotated

from app.auth.dependencies import (
    active_user,
    get_verified_user,
    oauth2_scheme,
)
from app.models.barrier import BarrierTech, BarrierTechInfo
from app.models.match import Match
from app.models.player import Player
from app.utils.barrier import (
    activate_binding_vow,
    activate_domain,
    activate_reverse_cursed_technique,
    activate_simple_domain,
    conditions_for_barrier_tech,
    fix_barrier_deactivation_task_fail,
)
from app.utils.config import PlayerException, Tag
from app.utils.dependencies import atp, session
from app.utils.player import get_alive_player
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    status,
)

router = APIRouter(
    prefix="/barrier",
    tags=[Tag.barrier],
    dependencies=[Depends(oauth2_scheme), Depends(get_verified_user)],
)


@router.post("/activate/domain/{player_id}/{match_id}", response_model=BarrierTechInfo)
async def domain_expansion(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Path()],
    current_user: active_user,
    session: session,
    atp: atp,
) -> BarrierTech:
    """Activates the domain of a player in an ongoing match.\n
    Buffs the vote to x4 per vote.\n
    Weakend by simple domain"""
    # first get the match, check if it is ongoing
    match = session.get(Match, match_id)
    player = get_alive_player(session=session, player_id=player_id)

    # get the condition necessary for a BT
    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player,
        match=match,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # check for pontential deactivate task fails
    fix_barrier_deactivation_task_fail(barrier_tech, session)

    # only grade 1 and higher can use DE
    if player.grade > Player.Grade.ONE:
        raise PlayerException(
            player,
            status.HTTP_426_UPGRADE_REQUIRED,
            "Only Players of Grade ONE or higher can use Domain Expansion. Upgrade your player",
        )

    # check if player has an active BT
    # then prevent activating domain expansion
    # check that their grade is lower than special grade (i.e player_grade(0-4) > special_grade(0))
    if (
        barrier_tech.binding_vow is True or barrier_tech.simple_domain is True
    ) and player.grade > Player.Grade.SPECIAL:
        raise PlayerException(
            player=player,
            code=status.HTTP_409_CONFLICT,
            detail="You have another barrier technique currently active. "
            "only special grade players can activate multiple barrier techniques at once.",
        )

    # check if they have reach limit for domain expansion in a match
    if (
        barrier_record is not None
        and (count := barrier_record.domain_counter) >= atp.limit_domain_expansion
    ):
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"domain can only be activated {count} times per match",
        )

    # checks if domain is currently already active
    elif (
        end_time := barrier_tech.de_end_time
    ) is not None and barrier_tech.domain_expansion is True:
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

        # for now use only in dev mode
        """if barrier_tech.bv_end_time is not None and settings.debug:
            # schedule background task for deactivation
            await deactivate_domain.schedule_by_time(
                redis_source, barrier_tech.bv_end_time, barrier_tech, session
            )"""

        return barrier_tech


@router.post("/activate/simple/{player_id}/{match_id}", response_model=BarrierTechInfo)
async def simple_domain(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Path()],
    current_user: active_user,
    session: session,
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
    player_none = get_alive_player(session=session, player_id=player_id)

    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player_none,
        match=match_none,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # check for potential DE end task fail
    fix_barrier_deactivation_task_fail(barrier_tech, session)

    # only grade 2 and higher can use SD
    if player.grade > Player.Grade.TWO:
        raise PlayerException(
            player,
            status.HTTP_426_UPGRADE_REQUIRED,
            "Only Players of Grade TWO or higher can use Simple Domain. Upgrade your player",
        )

    # check if player has an active barrier tech
    # and prevent activating simple domain
    if (
        barrier_tech.domain_expansion is True or barrier_tech.binding_vow is True
    ) and player.grade > Player.Grade.SPECIAL:
        raise PlayerException(
            player=player,
            code=status.HTTP_409_CONFLICT,
            detail="You have another barrier technique currently active. "
            "only special grade players can activate multiple barrier techniques at once.",
        )

    if (
        # check if they have a barrier record for the match.
        # and if they have not pass their limit for this technique / per match (barrier record)
        barrier_record is not None
        and (count := barrier_record.simple_domain_counter) >= atp.limit_simple_domain
    ):
        # raise limit reach error
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"simple domain can only be activated {count} times per match",
        )

    elif (
        end_time := barrier_tech.sd_end_time
    ) is not None and barrier_tech.simple_domain is True:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Simple Domain is already active, deactivates in {
                round(
                    (end_time - datetime.now(UTC)).total_seconds(),
                    1,
                )
            } seconds.",
        )

    else:  # no simple domain activated
        barrier_tech = activate_simple_domain(
            barrier_tech, barrier_record, match, session, atp
        )

        # schedule background task for deactivation
        """if barrier_tech.sd_end_time is not None and settings.debug:
            # schedule background task for deactivation
            await deactivate_simple_domain.schedule_by_time(
                redis_source, barrier_tech.sd_end_time, barrier_tech, session
            )"""

        return barrier_tech


@router.post("/activate/binding/{player_id}/{match_id}", response_model=BarrierTechInfo)
async def bindind_vow(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Path()],
    current_user: active_user,
    session: session,
    atp: atp,
):
    "activates a binding vow"
    match_none = session.get(Match, match_id)
    player_none = get_alive_player(session=session, player_id=player_id)

    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player_none,
        match=match_none,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # fix any deactivation fails
    fix_barrier_deactivation_task_fail(barrier_tech, session)

    # only grade 3 and higher can use BV
    if player.grade > Player.Grade.THREE:
        raise PlayerException(
            player,
            status.HTTP_426_UPGRADE_REQUIRED,
            "Only Players of Grade THREE or higher can use Binding Vow. Upgrade your player",
        )

    # check if player has an active barrier tech
    # and prevent activating BV
    if (
        barrier_tech.domain_expansion is True or barrier_tech.simple_domain is True
    ) and player.grade > Player.Grade.SPECIAL:
        raise PlayerException(
            player=player,
            code=status.HTTP_409_CONFLICT,
            detail="You have another barrier technique currently active. "
            "only special grade players can activate multiple barrier techniques at once.",
        )

    # 1. check if they have a barrier record for this match
    # and if they have reach their limit
    if (
        barrier_record
        and (count := barrier_record.binding_vow_counter) >= atp.limit_binding_vow
    ):
        raise PlayerException(
            player,
            status.HTTP_423_LOCKED,
            f"binding vow can only be activated {count} times per match",
        )

    # 2. check if their binding vow is currectly activated
    elif (
        barrier_tech.binding_vow is True
        and (end_time := barrier_tech.bv_end_time) is not None
    ):
        raise PlayerException(
            player,
            status.HTTP_409_CONFLICT,
            f"Binding Vow is already active, deactivates in {
                round(
                    (end_time - datetime.now(UTC)).total_seconds(),
                    1,
                )
            } seconds.",
        )

    # 3. no binding vow activated
    else:
        barrier_tech = activate_binding_vow(
            barrier_tech, barrier_record, match, session, atp
        )

        """if barrier_tech.bv_end_time is not None and settings.debug:
            # schedule background task for deactivation
            await deactivate_binding_vow.schedule_by_time(
                redis_source, barrier_tech.bv_end_time, barrier_tech, session
            )"""

        return barrier_tech


@router.post("/activate/rct/{player_id}/{match_id}", response_model=BarrierTechInfo)
def reverse_cursed_technique(
    player_id: Annotated[int, Path()],
    match_id: Annotated[int, Path()],
    current_user: active_user,
    session: session,
    atp: atp,
):
    "activates a reverse cursed technique"
    match_none = session.get(Match, match_id)
    player_none = get_alive_player(session=session, player_id=player_id)

    barrier_tech, barrier_record, match, player = conditions_for_barrier_tech(
        player=player_none,
        match=match_none,
        player_id=player_id,
        match_id=match_id,
        current_user=current_user,
        session=session,
    )

    # only special grade can use RCT
    if player.grade != Player.Grade.SPECIAL:
        raise PlayerException(
            player,
            status.HTTP_426_UPGRADE_REQUIRED,
            "Only Special Grade Players can use Reverse Cursed Technique. Upgrade your player",
        )

    # 1. check if they have a barrier record for this match
    # and if they have reached their limit
    if (
        barrier_record
        and (count := barrier_record.reverse_cursed_technique_counter)
        >= atp.limit_reverse_cursed_technique
    ):
        raise PlayerException(
            player,
            status.HTTP_423_LOCKED,
            f"reverse cursed technique can only be used {count} times per match",
        )

    # 2. activate rct
    else:
        barrier_tech = activate_reverse_cursed_technique(
            barrier_tech, barrier_record, match, session, atp
        )
        return barrier_tech


@router.post("/deactivate/barrier/{player_id}", response_model=BarrierTechInfo)
def deactivate_domain_expansion(player_id: Annotated[int, Path()], session: session):
    """
    deactivates any expired barrier technique\n
    does nothing if barrier tech should still be active.\n
    if player has no barrier tech, will raise an error
    """

    # get a living player
    player_alive = get_alive_player(session=session, player_id=player_id)

    if not player_alive:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Player {player_id}, does not exist."
        )

    if not player_alive.barrier_technique:
        msg = "player has no barrier technique"
        raise PlayerException(
            player=player_alive,
            code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    fix_barrier_deactivation_task_fail(player_alive.barrier_technique, session)

    return player_alive.barrier_technique
