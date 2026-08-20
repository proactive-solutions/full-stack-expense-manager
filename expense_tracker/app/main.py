from collections.abc import Generator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    from .routes import router  # noqa: WPS433

    application = FastAPI(title="Personal Expense Tracker", version="1.0.0", lifespan=lifespan)
    application.include_router(router)
    return application


app = create_app()
