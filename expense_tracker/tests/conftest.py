from collections.abc import Generator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from starlette.testclient import TestClient

from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///./test_expenses.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def test_lifespan(app: FastAPI) -> Generator[None, None, None]:
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def create_test_app() -> FastAPI:
    from app.routes import router

    application = FastAPI(title="Test Expense Tracker", lifespan=test_lifespan)
    application.include_router(router)
    application.dependency_overrides[get_db] = override_get_db
    return application


def get_test_client() -> Generator[TestClient, None, None]:
    app = create_test_app()
    with TestClient(app) as client:
        yield client
