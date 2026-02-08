from sqlmodel import Session, select

from app.api.setting import sio
from app.models.match import Match
from app.models.vote import Vote
from backend.app.models.base import BaseVoteInfo

from ..database.pgsql import engine


# Event: when a client connects
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit("message", {"msg": f"Welcome {sid}!"}, to=sid)


# Event: when a client disconnects
@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    await sio.emit("message", {"msg": f"{sid} left!"})


# Event: on receiving a chat message
@sio.event
async def message(sid, data):
    msg = data.get("msg")
    print(f"Message from {sid}: {msg}")
    # Broadcast to all clients
    await sio.emit("message", {"msg": msg})


# Event for sending update of match votes
@sio.event
async def vote_casted(sid, data):
    match_id = data.get("match_id")

    if match_id:
        # get the votes of that match
        with Session(engine) as session:
            stmt = select(Vote).join(Match).where(Vote.match_id == match_id)
            votes = session.exec(stmt).all()

            # make a list of BaseVoteInfo
            base_votes = [BaseVoteInfo.model_validate(vote) for vote in votes]

            # emit vote data to client
            await sio.emit("vote_casted", data=base_votes)
