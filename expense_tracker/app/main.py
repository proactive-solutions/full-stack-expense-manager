from collections.abc import Generator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    from .routes import router  # noqa: WPS433

    application = FastAPI(title="Personal Expense Tracker", version="1.0.0", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(router)
    return application


app = create_app()
