from typing import Annotated, Union

from app.models.barrier import BarrierTech
from app.models.player import (
    BasePlayerInfo,
    CreateCT,
    CreateCTApp,
    CreatePlayer,
    CTApp,
    CursedTechnique,
    EditCT,
    EditCTApp,
    EditPlayer,
    Player,
    PlayerInfo,
)
from app.utils.barrier import fix_barrier_deactivation_task_fail
from app.utils.config import Tag, UserException
from app.utils.dependencies import atp, colony, session
from app.utils.player import (
    calculate_points,
    edit_player_helper,
    get_player,
    points_required_for_upgrade,
)
from app.utils.user import (
    get_user,
    id_name_email,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, status
from sqlmodel import or_, select

from ..auth.dependencies import active_user, oauth2_scheme

# PLAYERS

router = APIRouter(
    prefix="/player", dependencies=[Depends(oauth2_scheme)], tags=[Tag.player]
)


@router.post(
    "/create/{user}",
    response_model=PlayerInfo,
    response_description="New Player",
    summary="Create a new player",
    status_code=status.HTTP_201_CREATED,
)
def create_player(
    session: session,
    colony: colony,
    current_user: active_user,
    user: id_name_email,
    player: Annotated[CreatePlayer, Body()],
    cursed_technique: Annotated[CreateCT, Body()],
    applications: Annotated[list[CreateCTApp], Body(min_length=5, max_length=5)],
):
    userdb = get_user(session, user)
    if userdb:
        if (
            userdb.id != current_user.id
        ):  # logged user is not the userid trying to create a player
            err_msg = "Cannot create a player for another user"
            raise UserException(userdb, status.HTTP_406_NOT_ACCEPTABLE, err_msg)
        # check if user already has a player
        elif userdb.player:
            err_msg = f"{userdb.username} already has a player '{userdb.player.name}'. Edit player instead."
            raise UserException(userdb, status.HTTP_409_CONFLICT, err_msg)
        else:  # user has no player
            # ct router instances, for ct_ins; enumerate to get index for CTApp number
            ct_apps_ins = [
                CTApp.model_validate(ct_app, update={"number": inx + 1})
                for inx, ct_app in enumerate(applications)
            ]
            update_ct = {"applications": ct_apps_ins}
            ct_ins = CursedTechnique.model_validate(
                cursed_technique, update=update_ct
            )  # cursed technique instance
            update_player = {
                "cursed_technique": ct_ins,
                "user": userdb,
                "colony": colony,
            }
            new_player = Player.model_validate(player, update=update_player)
            session.add(new_player)
            session.commit()
            session.refresh(new_player)
            return new_player
    else:  # no user found
        err_msg = f"User '{user}' not found"
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=err_msg)


@router.get(
    "/me",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="A Player",
    summary="Get a player of the logged in user",
)
def my_player(session: session, current_user: active_user):
    if current_user.player and type(current_user.player.id) is int:
        player = get_player(session, current_user.player.id)
        if player:
            # deactive any potential barrier end task fails
            fix_barrier_deactivation_task_fail(player.barrier_technique, session)
            return player
        else:
            err_msg = "User has no Player"
            raise UserException(current_user, status.HTTP_404_NOT_FOUND, err_msg)
    else:
        err_msg = f"{current_user.username} has no player. Create player."
        raise UserException(current_user, status.HTTP_404_NOT_FOUND, detail=err_msg)


@router.get(
    "/all",
    response_model=Union[list[PlayerInfo], list[BasePlayerInfo]],
    status_code=status.HTTP_200_OK,
    response_description="A list of players",
    summary="Get a list of players.",
)
def get_players(
    session: session,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(le=30)] = 10,
    slim: Annotated[
        bool, Query(description="If true, minimal player info will be returned")
    ] = False,
    gender: Annotated[Player.Gender | None, Query()] = None,
    age: Annotated[int | None, Query(ge=10, le=102)] = None,
    role: Annotated[str | None, Query()] = None,
):
    statement = select(Player).offset(offset).limit(limit)
    # if clauses to add a where/or clause to the statement
    if gender is not None:
        statement = statement.where(or_(Player.gender == gender))
    if age is not None:
        statement = statement.where(or_(Player.age == age))
    if role is not None:
        statement = statement.where(or_(Player.role == role))
    # execute
    players = session.exec(statement).all()
    # if slim return info without cursed technique info and user info
    if slim is True:
        players = [BasePlayerInfo.model_validate(player) for player in players]
    return players


@router.get(
    "/{player_id}",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="A Player",
    summary="Get a player with their ID",
)
def a_player(player_id: Annotated[int, Path()], session: session):
    player = get_player(session, player_id)
    if player:
        # deactive any potential barrier end task fails
        fix_barrier_deactivation_task_fail(player.barrier_technique, session)
        return player
    else:
        err_msg = f"player ID '{player_id}' not found"
        raise HTTPException(status.HTTP_404_NOT_FOUND, err_msg)


@router.patch(
    "/edit/{player_id}",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="Edited Player",
    summary="Edit a player details.",
)
def edit_player(
    *,
    player_id: int,
    session: session,
    current_user: active_user,
    player: Annotated[EditPlayer | None, Body()] = None,
    cursed_technique: Annotated[EditCT | None, Body()] = None,
    applications: Annotated[list[EditCTApp] | None, Body(max_length=5)] = None,
):
    """If an application is sent, it should have a valid number for the application you want to edit.
    \nTo check an application number, first get a player info using the **'/players/{player_id}'** request.
    \nElse the application will be disregarded, valid numbers are 1-5.
    """
    playerdb = get_player(session, player_id)
    if playerdb:
        if playerdb.user_id != current_user.id:
            raise UserException(current_user, detail="Can only edit your own player.")
        else:  # update database infos
            edited_player = edit_player_helper(
                playerdb=playerdb,
                player=player,
                cursed_technique=cursed_technique,
                applications=applications,
                session=session,
            )
            # add edited_player to session, and commit to update infos
            session.add(edited_player)
            session.commit()
            session.refresh(edited_player)
            return playerdb
    else:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Player with ID {player_id} not found"
        )


@router.delete(
    "/delete/{player_id}",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="A deleted player",
    summary="Delete a player",
)
def delete_player(player_id: int, session: session, current_user: active_user):
    playerdb = session.get(Player, player_id)
    if playerdb:
        if playerdb.user_id == current_user.id:  # logged in user matches players user
            # if player has a match, set their status to dead instead (to avoid not null violation)
            if (len(playerdb.matches) > 0) or (len(playerdb.votes) > 0):
                playerdb.alive = False
                session.add(playerdb)
                # commit relevant changes
                session.commit()
                session.refresh(playerdb)
                return playerdb
            else:  # thoroughly delete player
                # colony is not deleted, but assigned to a variable
                # to avoid detached error when/if fetched later, after playerdb is deleted
                colony = playerdb.colony
                # add ct apps to  a variable and add/append to delete session
                ct_apps = playerdb.cursed_technique.applications
                for app in ct_apps:
                    session.delete(app)
                else:  # after for loop
                    playerdb.alive = False
                    session.delete(playerdb.cursed_technique)
                    if playerdb.barrier_technique:
                        session.delete(playerdb.barrier_technique)
                    session.delete(playerdb)

                # commit relevant changes
                session.commit()

                # create a new player info. This is done because after player is deleted
                # it is removed from the session(detached state), and returning the playerdb
                # will attempt to fetch its respective user and colony, and will fail.
                # having the user(current user) and colony(colony) in variables
                # prevents this failure, but i think it is better to be explicit, as to avoid potential bugs.
                update_user_colony = {"colony": colony, "user": current_user}
                deleted_player = PlayerInfo.model_validate(
                    playerdb, update=update_user_colony
                )
                return deleted_player
        else:  # player user don't match
            err_msg = "Attempting to delete another player."
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, err_msg)
    else:
        err_msg = f"Player with ID '{player_id}' not found"
        raise HTTPException(status.HTTP_404_NOT_FOUND, err_msg)


@router.post("/upgrade/{player_id}", response_model=PlayerInfo)
def upgrade_player(
    player_id: Annotated[int, Path(description="the player id")],
    session: session,
    grade_up: Annotated[Player.Grade, Query(description="specified upgrade")],
    current_user: active_user,
    atp: atp,
):
    """function for uprading the grade of a player.\n
    **points required.**"""
    player = session.get(Player, player_id)
    if player is not None:
        if player != current_user.player:
            msg = "cannot upgrade another player; wrong player id."
            raise UserException(current_user, status.HTTP_401_UNAUTHORIZED, msg)
        else:
            # get the current grade
            current_grade = player.grade
            # check if it is less or equal to grade_up
            if (cg := current_grade.value) <= (gu := grade_up.value):
                if cg == 0:
                    msg = f"Already {current_grade.name} Grade; {current_grade.name} Grade is the highest grade attainable."
                else:
                    msg = f"grade to promote ({grade_up.name}) value: '{gu}', should be less than current grade ({current_grade.name}) value: '{cg}'"
                raise HTTPException(status.HTTP_417_EXPECTATION_FAILED, msg)
            else:
                player_points = player.points
                # get the required points for upgrade
                needed_points = points_required_for_upgrade(grade_up)
                # check if player points is enough
                if player_points >= needed_points:  # there is enough
                    # check if they have reached the level to access Barrier Tech
                    if (
                        gu <= atp.bt_min_grade and cg > atp.bt_min_grade
                    ):  # grant barrier technique
                        new_barrier_tech = BarrierTech(player=player)
                        session.add(new_barrier_tech)
                    # upgrade and deduct points
                    player.grade = grade_up
                    # deduct points used
                    player.points = calculate_points(
                        player.points, needed_points, "minus"
                    )
                    session.add(player)
                    session.commit()
                    session.refresh(player)
                    return player
                else:  # not enough points
                    msg = f"not enough points; current points: {player_points}; needed points: {needed_points}"
                    raise HTTPException(status.HTTP_412_PRECONDITION_FAILED, msg)
    else:  # player does not exist
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"player {player_id}, does not exist"
        )
