from sqlmodel import Session, select

from app.api.setting import sio
from app.models.base import BaseVoteInfo
from app.models.match import Match
from app.models.vote import Vote

from ..database.pgsql import engine


# Event: when a client connects
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit("message", {"message": f"Welcome {sid}!"}, to=sid)


# Event: when a client disconnects
@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    await sio.emit("message", {"message": f"{sid} left!"})


# Event: on receiving a chat message
@sio.event
async def chat(sid, data):
    message = data.get("message")
    print(f"Message from {sid}: {message}")
    # Broadcast to all clients
    await sio.emit("chat", {"message": message})


# Event for sending update of match votes
@sio.event
async def vote_casted(sid, data):
    match_id = data.get("match_id")

    if match_id:
        print("socket server received vote casted for match", match_id)
        # get the votes of that match
        with Session(engine) as session:
            stmt = select(Vote).join(Match).where(Vote.match_id == match_id)
            votes = session.exec(stmt).all()

            # make a list of BaseVoteInfo
            base_votes = [
                BaseVoteInfo.model_validate(vote).model_dump() for vote in votes
            ]

            # emit vote data to client
            await sio.emit("vote_casted", data=base_votes)
