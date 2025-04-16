from datetime import datetime, timezone
import time
from typing import Literal

from fastapi import HTTPException, status
from sqlmodel import select

from app.models.barrier import BarrierRecord, BarrierTech
from app.models.match import Match
from app.models.player import Player
from app.models.user import User
from app.utils.config import UserException
from app.utils.dependencies import atp, session
from app.utils.match import ongoing_match
from app.utils.player import calculate_points


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
        new_barrier_detail = BarrierRecord(
            domain_counter=1, match=match, barrier_tech=barrier_tech
        )
        session.add(new_barrier_detail)
    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)
    return barrier_tech


def deactivate_domain(barrier_tech: BarrierTech, session: session):
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
        if barrier_tech.de_end_time is None:
            # deactivate domain
            barrier_tech.de_end_time = None
            barrier_tech.domain_expansion = False
            session.add(barrier_tech)
            session.commit()
            active = False
            break
        # see if time for deactivation has reached
        elif now >= barrier_tech.de_end_time:
            # deactivate domain
            barrier_tech.de_end_time = None
            barrier_tech.domain_expansion = False
            session.add(barrier_tech)
            session.commit()
            active = False
            break
        else:
            # add a time pause if deactivation time is still further
            remaining_time = (barrier_tech.de_end_time - now).total_seconds()
            if remaining_time < 0:
                continue  # loop here to avoid negative float being supplied to time.sleep
            time.sleep(remaining_time // 2)  # remaining time divide by 2
            continue  # loop again


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
    Otherwise raise a `HTTPException` error.\n
    Conditions:\n\t
    * match must exist
    * player must exist
    * player must have a barrier technique; player of grade 2 up
    \nreturns a tuple of `BarrierTech`, `BarrierRecord` if any, the `Match` the `BarrierTech` will be used in, and `Player`.
    """
    if player is not None:
        if match is not None:
            if player.user_id != current_user.id:
                msg = "cannot activate simple domain of another player"
                raise UserException(current_user, status.HTTP_406_NOT_ACCEPTABLE, msg)
            else:
                if ongoing_match(match) is True:
                    # check if domain has been actvated before
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
                        raise HTTPException(status.HTTP_428_PRECONDITION_REQUIRED, msg)
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


def activate_simple_domain(
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match,
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
        new_barrier_detail = BarrierRecord(
            simple_domain_counter=1, match=match, barrier_tech=barrier_tech
        )
        session.add(new_barrier_detail)
    # commits
    session.add(barrier_tech)
    session.commit()
    session.refresh(barrier_tech)
    return barrier_tech


def deactivate_simple_domain(barrier_tech: BarrierTech, session: session):
    "function for the background task of deactivating a simple domain"
    active = True
    while active:
        now = datetime.now(timezone.utc)  # the current time
        # check if there is no end time for the specified barrier tech SD
        if barrier_tech.sd_end_time is None:
            # deactivate simple domain
            barrier_tech.sd_end_time = None
            barrier_tech.simple_domain = False
            session.add(barrier_tech)
            session.commit()
            active = False
            break
        # see if time for deactivation has reached
        elif now >= barrier_tech.sd_end_time:
            # deactivate domain
            barrier_tech.de_end_time = None
            barrier_tech.domain_expansion = False
            session.add(barrier_tech)
            session.commit()
            active = False
            break
        else:
            # add a time pause if deactivation time is still further
            remaining_time = (barrier_tech.sd_end_time - now).total_seconds()
            if remaining_time < 0:
                continue  # loop here to avoid negative float being supplied to time.sleep

            time.sleep(remaining_time // 2)  # remaining time divide by 2
            continue  # loop again


def activate_barrier_tech(
    technique: Literal["domain_expansion", "simple_domain", "binding_vow"],
    barrier_tech: BarrierTech,
    barrier_record: BarrierRecord | None,
    match: Match,
    session: session,
    atp: atp,
):
    "function for a match/case implementation of barrier techniques"
    # make the variables depending on which technique to activate
    match technique:
        case "simple_domain":
            activate_simple_domain(barrier_tech, barrier_record, match, session, atp)
        case "domain_expansion":
            activate_domain(barrier_tech, barrier_record, match, session, atp)
        case "simple_domain":
            activate_simple_domain(barrier_tech, barrier_record, match, session, atp)
