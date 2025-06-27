"""module for the match routers"""

from typing import Annotated

from app.api.setting import redis_source, settings
from app.auth.dependencies import admin_user, oauth2_scheme
from app.models.admin import Permission
from app.models.base import ModelName
from app.models.match import Match, MatchInfo
from app.routers.votes import router as vote_router
from app.utils.config import AdminException, Tag
from app.utils.dependencies import atp, session
from app.utils.match import (
    assign_match_winner,
    create_new_match,
    get_last_created_match,
    get_match,
    ongoing_match,
)
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    Query,
    status,
)
from sqlmodel import select

# write you match api routes here

router = APIRouter(
    prefix="/match", tags=[Tag.match], dependencies=[Depends(oauth2_scheme)]
)
router.include_router(vote_router)


@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=MatchInfo)
async def create_match(
    part: Annotated[int, Query()],
    session: session,
    admin: admin_user,
    atp: atp,
):
    """path operation for automatically creating a match, requires a part query."""
    # first get the permission for creating match
    permission = session.exec(
        select(Permission)
        .where(Permission.model == ModelName.match)
        .where(Permission.level == Permission.PermissionLevel.CREATE)
    ).first()

    if permission is not None:
        # check if admin user has permission
        if permission in admin.permissions or admin.is_superuser:
            # get the last match that was created, to check if it has ended
            last_match = get_last_created_match(session)
            if last_match is not None:
                # check if it has ended
                if ongoing_match(last_match) is True:
                    msg = f"Previous Match: ID {last_match.id}, part {last_match.part} has not ended"
                    raise HTTPException(status.HTTP_406_NOT_ACCEPTABLE, msg)
                else:  # previous match has ended; create match
                    new_match = create_new_match(session, part, atp)
                    session.add(new_match)
                    session.commit()
                    session.refresh(new_match)

                    # schedule assign match winner
                    if settings.debug:
                        await assign_match_winner.schedule_by_time(
                            redis_source, new_match.end, new_match, atp, session
                        )

                    return new_match

            else:  # Not a single match have been create; Create match anyway
                new_match = create_new_match(session, part, atp)
                session.add(new_match)
                session.commit()
                session.refresh(new_match)
                return new_match
        else:  # admin doesn't have permission to create match
            raise AdminException(
                admin,
                code=status.HTTP_401_UNAUTHORIZED,
                detail=f"{admin.user.username} doesn't have permission to create a {ModelName.match}.",
            )
    else:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Permission to create a match does not exist, contact a superuser",
        )


@router.get("/all", response_model=list[MatchInfo])
def get_matches(
    session: session,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(le=30)] = 10,
):
    "get all matches"
    stmt = select(Match).offset(offset).limit(limit)
    result = session.exec(stmt).all()
    if result:
        return result
    else:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No matches yet...")


@router.get("/latest", response_model=MatchInfo)
def get_lastest_match(
    session: session,
    ongoing: Annotated[bool, Query(description="should be an ongoing match")] = False,
):
    "get last created match"
    result = get_last_created_match(session)
    if result:
        # check if they want only ongoing latest match
        if ongoing is True:
            if ongoing_match(result) is False:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "No ongoing match")

        return result
    else:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No latest match")


@router.delete("/delete/{match_id}", response_model=MatchInfo)
def delete_match(
    match_id: Annotated[int, Path()],
    session: session,
    admin: admin_user,
):
    """
    Deletes a match from the database given its ID after verifying delete permissions.\f

    This endpoint operation checks whether the specified administrative user has the
    required permission to delete a match. First, it looks up the permission for deletion
    on the match model. If the permission exists, it then validates whether the admin
    either possesses this permission or is a superuser. If the admin is authorized, the
    function attempts to retrieve the match by its match_id. If the match is found, it
    will be deleted from the database and the deleted match object is returned. If it is
    not found, an HTTPException with a 404 status code is raised. If the admin lacks
    the required permission, a UserException is raised. If the delete permission itself
    is not defined, an HTTPException with a 403 status code is raised.

    Parameters:
        match_id (int): The ID of the match to be deleted, passed as a query parameter.
        session (Session): The current database session used for executing queries.
        admin (AdminUser): The admin user attempting to delete the match, used to check authorization.

    Returns:
        The deleted match object if the deletion is successful.

    Raises:
        HTTPException: If the match does not exist (404 Not Found) or the deletion permission
                       is not defined (403 Forbidden).
        AdminException: If the admin does not have the authorization to delete the match
                       (401 Unauthorized).
    """
    # first get the permission for creating match
    permission = session.exec(
        select(Permission)
        .where(Permission.model == ModelName.match)
        .where(Permission.level == Permission.PermissionLevel.DELETE)
    ).first()
    if permission is not None:
        # check if admin user has permission
        if permission in admin.permissions or admin.is_superuser:
            # get the match
            match = get_match(session=session, match_id=match_id)
            if match is not None:
                colony = match.colony
                winner = match.winner
                session.delete(match)
                session.commit()
                # construct deleted match non list (since list can be empty) relations to avoid detached error
                relations_update = {
                    "colony": colony,
                    "winner": winner,
                }
                deleted_match = Match.model_validate(match, update=relations_update)
                return deleted_match
            else:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND, f"Match with Id: {match_id}, Not Found"
                )
        else:  # admin doesn't have permission to create match
            raise AdminException(
                admin,
                code=status.HTTP_401_UNAUTHORIZED,
                detail=f"{admin.user.username} doesn't have permission to create a match.",
            )
    else:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Permission to delete a match does not exist, contact a superuser",
        )


@router.post("/winner/{match_id}", response_model=MatchInfo)
def match_winner(
    match_id: Annotated[int, Path()],
    atp: atp,
    session: session,
):
    "calculates, assigns, and returns the winner of a match, or draw is True if Draw."

    # get match
    match = get_match(session=session, match_id=match_id)

    if not match:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Match with ID {match_id} not found"
        )

    # perform process
    match_winner = assign_match_winner(match=match, atp=atp, session=session)

    return match_winner
