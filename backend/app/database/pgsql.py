"""a module that handles the connection of sqlmodel to postgresql\n
The engine object can be import from this module"""

from sqlmodel import create_engine

from app.api.setting import settings

# create engine variable
engine = create_engine(
    settings.database_url,  # type: ignore
    # echo=True
)
