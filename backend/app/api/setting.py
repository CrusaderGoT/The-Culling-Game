"""settings for the api"""

from contextlib import asynccontextmanager
from uuid import UUID

import socketio

# import taskiq_fastapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from pydantic_settings import BaseSettings

from app.api.broker import broker


class Settings(BaseSettings):
    "class for env or default settings."

    database_url: str = "postgresql://postgres:crusader@localhost/CullingGamesDB"
    secret_key: str = "7f820bef39dd81f92e9935b30f029a74af7b7d1c5d8c85c855d6b22d093d485c"
    algorithm: str = "HS256"
    code: UUID = UUID("a24cd617-5d2e-4317-970d-162f315d0397")
    debug: bool = False
    enviroment: str = "developement"
    access_token_expire: int = 900_000
    "in milliseconds"
    refresh_token_expire: int = 604_800_000
    "in milliseconds"


settings = Settings()


def custom_generate_unique_id(route: APIRoute):
    return f"{route.name}"


# lifespan event
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not broker.is_worker_process:
        # Never forget to call startup in the beginning.
        await broker.startup()

    yield

    if not broker.is_worker_process:
        await broker.shutdown()


# initialize fastapi
app = FastAPI(
    title="The Culling Games API",
    description="The API Docs for The Culling Games",
    generate_unique_id_function=custom_generate_unique_id,
    docs_url=None,
    debug=settings.debug,
    lifespan=lifespan,
)
"""
The Global FastAPI app. To allow for use in multiple files.\n
* ### Everything needed for the initailization of the app instance, should be made in the same directory as where this app is instantiated. Eg. CORS, Middleware, etc.\n
#### example:
>>> from api.settings import app
>>> @app.get('/')
>>> # rest of your code
"""

# Create a Socket.IO server with asyncio
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)
"""
The Global Socket.io server. To allow for use in multiple files.\n
Should typically be used by converting a router function
main code block to a `_sub_helper` function,
and then use that helper in both `sio`,`router`or`app`.
#### example:
>>> from api.settings import sio
>>> @sio.on("my_event")
>>> def my_event:
        _sub_helper()
"""


# Wrap the Socket.IO server with ASGIApp
socket_app = socketio.ASGIApp(sio, app, socketio_path="/ws")
"""The Websocket App, to be mounted on the main FastAI app."""

# Mount the Socket.IO app to a specific route
app.mount("/ws", socket_app)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# MIDDLEWARE

allowed_hosts = [
    "localhost",  # for development
    "testserver",  # for testing
    "the-culling-games.up.railway.app",
    "the-culling-games.vercel.app",
    "github.com",  # for actions
]

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)


origins = [
    "http://localhost:3000",
    "https://the-culling-games.vercel.app",
    "https://the-culling-games.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
