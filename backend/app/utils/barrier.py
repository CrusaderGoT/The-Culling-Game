import random
import time
from datetime import UTC, datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import select

from app.models.barrier import BarrierRecord, BarrierTech
from app.models.match import Match
from app.models.player import Player
from app.models.user import User
from app.utils.config import PlayerException, UserException
from app.utils.dependencies import atp, session
from app.utils.match import ongoing_match
from app.utils.player import calculate_points


def conditions_for_barrier_tech(
    session: session,
    player_id: int,
    match_id: int,
    player: Player | None,
    match: Match | None,
    current_user: User,
):
    """
    function for meeting the conditions nesseccary for the use of a barrier tech.
    i.e, check if player has a barrier technique.\n
    Otherwise raise a `PlayerException`or `HTTPException` error .\n
    Conditions:\n\t
    * match must exist
    * player must exist
    * player must have a barrier technique; player of grade 2 up
    \nreturns a tuple of `BarrierTech`, `BarrierRecord` if any, the `Match` the `BarrierTech` will be used in, and `Player`.
    """
    if player is not None:
        if match is not None:
            if player.user_id != current_user.id:
                msg = "cannot activate barrier technique of another player"
                raise UserException(current_user, status.HTTP_406_NOT_ACCEPTABLE, msg)
            else:
                if ongoing_match(match) is True:
                    # check if a barrier tech (domain, etc) has been activated before
                    # get the Barrier technique of that player for the match
                    stmt = (
                        select(BarrierTech)
                        .join(Player)
                        .where(BarrierTech.player_id == player.id)
                    )
                    barrier_tech = session.exec(stmt).first()

                    # get the barrier details of the player for this match
                    bt_id = (
                        barrier_tech.id if barrier_tech else None
                    )  # the barrier tech ID, else None

                    st = (
                        select(BarrierRecord)
                        .join(BarrierTech)
                        .join(Match)
                        .where(BarrierRecord.barrier_tech_id == bt_id)
                        .where(BarrierRecord.match_id == match.id)
                    )
                    barrier_record = session.exec(st).first()

                    if barrier_tech is None:  # player has no barrier technique
                        msg = f"'{player.name}' doesn't have a barrier technique, upgrade the player to grade 2, to unlock Barrier Techniques"
                        raise PlayerException(
                            player=player,
                            code=status.HTTP_428_PRECONDITION_REQUIRED,
                            detail=msg,
                        )
                    else:  # return the barrier tech and  barrier record if any
                        return barrier_tech, barrier_record, match, player

                else:  # match has ended
                    raise HTTPException(
                        status.HTTP_423_LOCKED, f"Match ID: {match_id}, has Ended"
                    )

        else:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND, f"Match ID: {match_id}, does not exist."
            )
    else:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Player {player_id}, does not exist."
        )


def activate_domain(
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match: Match,
    session: session,
    atp: atp,
):
    "function for activating a domain"
    # activate domain
    barrier_tech.domain_expansion = True
    # set deactivation time
    barrier_tech.de_end_time = datetime.now(timezone.utc) + atp.domain_duration
    # deduct points
    barrier_tech.player.points = calculate_points(
        barrier_tech.player.points, atp.cost_domain_expansion, "minus"
    )
    # add/record the detail
    # the barrier detail should commited here
    if barrier_record is not None:
        barrier_record.domain_counter += 1
        session.add(barrier_record)
    else:  # no barrier detail
        new_barrier_record = BarrierRecord(
            domain_counter=1, match=match, barrier_tech=barrier_tech
        )
        session.add(new_barrier_record)
    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)
    return barrier_tech


def deactivate_domain(barrier_tech: BarrierTech, session: session):
    # deactivate domain
    barrier_tech.de_end_time = None
    barrier_tech.domain_expansion = False
    session.add(barrier_tech)
    session.commit()


def schedule_deactivate_domain(barrier_tech: BarrierTech, session: session):
    "function for the background task of deactivating a domain"
    # Ensure end_time is timezone-aware (UTC); if not, make it so
    if (barrier_tech.de_end_time) and (
        barrier_tech.de_end_time.tzinfo is None
        or barrier_tech.de_end_time.tzinfo.utcoffset(barrier_tech.de_end_time) is None
    ):
        barrier_tech.de_end_time = barrier_tech.de_end_time.replace(tzinfo=timezone.utc)
    active = True
    while active:
        now = datetime.now(timezone.utc)  # the current time
        # check if there is no end time for the specified barrier tech DE
        # and see if time for deactivation has reached
        if (barrier_tech.de_end_time is None) or (now >= barrier_tech.de_end_time):
            # deactivate domain
            deactivate_domain(barrier_tech, session)
            active = False
            break
        else:
            # add a time pause if deactivation time is still further
            remaining_time = (barrier_tech.de_end_time - now).total_seconds()
            if remaining_time < 0:
                continue  # loop here to avoid negative float being supplied to time.sleep
            time.sleep(remaining_time // 2)  # remaining time divide by 2
            continue  # loop again


def activate_simple_domain(
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match: Match,
    session: session,
    atp: atp,
):
    # activate simple domain
    barrier_tech.simple_domain = True
    # set deactivation time
    barrier_tech.sd_end_time = datetime.now(timezone.utc) + atp.simple_domain_duration
    # deduct points
    barrier_tech.player.points = calculate_points(
        barrier_tech.player.points, atp.cost_simple_domain, "minus"
    )
    # add/record the detail
    # the barrier detail should commited here
    if barrier_record is not None:
        barrier_record.simple_domain_counter += 1
        session.add(barrier_record)
    else:  # no barrier detail
        new_barrier_record = BarrierRecord(
            simple_domain_counter=1, match=match, barrier_tech=barrier_tech
        )
        session.add(new_barrier_record)
    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)
    return barrier_tech


def deactivate_simple_domain(barrier_tech: BarrierTech, session: session):
    # deactivate simple domain
    barrier_tech.sd_end_time = None
    barrier_tech.simple_domain = False
    session.add(barrier_tech)
    session.commit()


def schedule_deactivate_simple_domain(barrier_tech: BarrierTech, session: session):
    "function for the background task of deactivating a simple domain"

    # Ensure end_time is timezone-aware (UTC); if not, make it so
    if (barrier_tech.sd_end_time) and (
        barrier_tech.sd_end_time.tzinfo is None
        or barrier_tech.sd_end_time.tzinfo.utcoffset(barrier_tech.sd_end_time) is None
    ):
        barrier_tech.sd_end_time = barrier_tech.sd_end_time.replace(tzinfo=timezone.utc)

    active = True
    while active:
        now = datetime.now(timezone.utc)  # the current time
        # check if there is no end time for the specified barrier tech SD
        # or if time for deactivation has reached
        if (barrier_tech.sd_end_time is None) or (now >= barrier_tech.sd_end_time):
            # deactivate simple domain
            deactivate_simple_domain(barrier_tech, session)
            active = False
            break
        else:
            # add a time pause if deactivation time is still further
            remaining_time = (barrier_tech.sd_end_time - now).total_seconds()
            if remaining_time < 0:
                continue  # loop here to avoid negative float being supplied to time.sleep

            time.sleep(remaining_time // 2)  # remaining time divide by 2
            continue  # loop again


def activate_binding_vow(
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match: Match,
    session: session,
    atp: atp,
):
    barrier_tech.binding_vow = True
    barrier_tech.bv_end_time = datetime.now(timezone.utc) + atp.binding_vow_duration

    # deduct points
    barrier_tech.player.points = calculate_points(
        barrier_tech.player.points, atp.cost_binding_vow, "minus"
    )
    # add/record the detail
    # the barrier detail should commited here
    if barrier_record is not None:
        barrier_record.binding_vow_counter += 1
        session.add(barrier_record)
    else:  # no barrier detail
        new_barrier_record = BarrierRecord(
            binding_vow_counter=1, match=match, barrier_tech=barrier_tech
        )
        session.add(new_barrier_record)
    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)
    return barrier_tech


def deactivate_binding_vow(barrier_tech: BarrierTech, session: session):
    barrier_tech.binding_vow = False
    barrier_tech.bv_end_time = None
    session.add(barrier_tech)
    session.commit()


def schedule_deactivate_binding_vow(barrier_tech: BarrierTech, session: session):
    "function for the background task of deactivating a binding vow"
    # Ensure end_time is timezone-aware (UTC); if not, make it so
    if (barrier_tech.bv_end_time) and (
        barrier_tech.bv_end_time.tzinfo is None
        or barrier_tech.bv_end_time.tzinfo.utcoffset(barrier_tech.bv_end_time) is None
    ):
        barrier_tech.bv_end_time = barrier_tech.bv_end_time.replace(tzinfo=timezone.utc)

    active = True
    while active:
        now = datetime.now(timezone.utc)  # the current time
        # check if there is no end time for the specified barrier tech BV
        # and see if time for deactivation has reached
        if (barrier_tech.bv_end_time is None) or (now >= barrier_tech.bv_end_time):
            # deactivate binding vow
            deactivate_binding_vow(barrier_tech, session)
            active = False
            break
        else:
            # add a time pause if deactivation time is still further
            remaining_time = (barrier_tech.bv_end_time - now).total_seconds()
            if remaining_time < 0:
                continue  # loop here to avoid negative float being supplied to time.sleep
            time.sleep(remaining_time // 2)  # remaining time divide by 2
            continue  # loop again


def activate_reverse_cursed_technique(
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match: Match,
    session: session,
    atp: atp,
):
    barrier_tech.player.points += atp.reverse_cursed_technique_point
    # add/record the detail
    # the barrier detail should commited here
    if barrier_record is not None:
        barrier_record.reverse_cursed_technique_counter += 1
        session.add(barrier_record)
    else:  # no barrier detail
        new_barrier_record = BarrierRecord(
            reverse_cursed_technique_counter=1,
            match=match,
            barrier_tech=barrier_tech,
        )
        session.add(new_barrier_record)

    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)


def fix_barrier_deactivation_task_fail(
    barrier_tech: BarrierTech | None, session: session
):
    """
    checks and deactivates any barrier activations, that their end tasks failed.
    """
    if barrier_tech is not None:
        # for DE
        if (end_time := barrier_tech.de_end_time) is not None and datetime.now(
            UTC
        ) >= end_time:
            deactivate_domain(barrier_tech, session)

        # for SD
        if (end_time := barrier_tech.sd_end_time) is not None and datetime.now(
            UTC
        ) >= end_time:  # should have ended, but backgroud task failed
            # deactivate simple domain
            deactivate_simple_domain(barrier_tech, session)
    else:
        pass


def black_flash(current_vote_point: float, rng: random.Random = random.Random()):
    """
    Determine whether a “Black Flash” activates, using Beta distribution.
    """

    if current_vote_point <= 0:  # must be > 0
        return False

    impact = 0.000001  # Representing the precise timing
    scaled_impact = 1.0 - impact * 1000  # Scaled threshold

    # Using betavariate for less rare but still special Black Flash
    # betavariate(first_number, second_number):
    # - First number (current_vote): How often you get big values (HIGHER = more Black Flash)
    # - Second number (1): How consistent it is
    # (LOWER = more chaos, HIGHER = more predictable) -> with value relative to (current_vote_point)
    # Think: (how_often_special_happens, how_crazy_or_calm)
    # used 1 because current_vote_point will be 0.2 lower and around 1 when high
    flash_chance = rng.betavariate(current_vote_point, 1)

    return flash_chance >= scaled_impact
