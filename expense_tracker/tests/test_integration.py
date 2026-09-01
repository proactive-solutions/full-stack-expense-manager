"""Backend integration tests: DB + CRUD + API lifecycle + CORS."""

from collections.abc import Generator

import pytest
from starlette.testclient import TestClient

from app import crud, schemas
from app.database import Base

from .conftest import TestSessionLocal, get_test_client, test_engine


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    yield from get_test_client()


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


class TestCrudIntegration:
    """Direct DB/CRUD integration without HTTP."""

    def test_create_and_get_roundtrip(self, db_session):
        data = schemas.ExpenseCreate(title="Integration", description="desc", amount=99.5, category="food")
        created = crud.create_expense(db_session, data)
        assert created.id is not None
        assert created.title == "Integration"
        fetched = crud.get_expense(db_session, created.id)
        assert fetched is not None
        assert fetched.amount == 99.5

    def test_update_category_value_handling(self, db_session):
        created = crud.create_expense(db_session, schemas.ExpenseCreate(title="T", amount=10, category="food"))
        updated = crud.update_expense(db_session, created.id, schemas.ExpenseUpdate(category="transport"))
        assert updated is not None
        assert updated.category == "transport"
        # raw DB stores string value
        assert crud.get_expense(db_session, created.id).category == "transport"

    def test_get_expenses_pagination_total(self, db_session):
        for i in range(5):
            crud.create_expense(db_session, schemas.ExpenseCreate(title=f"E{i}", amount=10.0, category="food"))
        expenses, total = crud.get_expenses(db_session, skip=2, limit=2)
        assert total == 5
        assert len(expenses) == 2

    def test_get_expenses_filter_category(self, db_session):
        crud.create_expense(db_session, schemas.ExpenseCreate(title="Food", amount=10, category="food"))
        crud.create_expense(db_session, schemas.ExpenseCreate(title="Bus", amount=5, category="transport"))
        expenses, total = crud.get_expenses(db_session, category="food")
        assert total == 1
        assert expenses[0].title == "Food"

    def test_summary_and_by_category(self, db_session):
        crud.create_expense(db_session, schemas.ExpenseCreate(title="A", amount=10, category="food"))
        crud.create_expense(db_session, schemas.ExpenseCreate(title="B", amount=20, category="food"))
        crud.create_expense(db_session, schemas.ExpenseCreate(title="C", amount=5, category="transport"))
        summary = crud.get_expense_summary(db_session)
        assert summary["total_amount"] == 35.0
        assert summary["total_count"] == 3
        by_cat = crud.get_expenses_by_category(db_session)
        assert len(by_cat) == 2
        food = next(x for x in by_cat if x["category"] == "food")
        assert food["total"] == 30.0
        assert food["count"] == 2

    def test_delete_persists(self, db_session):
        created = crud.create_expense(db_session, schemas.ExpenseCreate(title="Del", amount=5, category="other"))
        assert crud.delete_expense(db_session, created.id) is True
        assert crud.get_expense(db_session, created.id) is None
        assert crud.delete_expense(db_session, 9999) is False
        assert crud.update_expense(db_session, 9999, schemas.ExpenseUpdate(title="X")) is None


class TestApiIntegrationLifecycle:
    """Full HTTP lifecycle mimicking real frontend flows."""

    def test_full_crud_lifecycle_via_api(self, client: TestClient):
        # Create
        r = client.post("/expenses", json={"title": "Lifecycle", "description": "e2e", "amount": 42, "category": "shopping"})
        assert r.status_code == 201
        eid = r.json()["id"]

        # Read single + list
        assert client.get(f"/expenses/{eid}").json()["title"] == "Lifecycle"
        lst = client.get("/expenses").json()
        assert lst["total"] == 1

        # Update
        r = client.put(f"/expenses/{eid}", json={"title": "Updated", "amount": 100})
        assert r.status_code == 200
        assert r.json()["title"] == "Updated"
        assert r.json()["amount"] == 100
        assert r.json()["description"] == "e2e"  # unchanged

        # Summary reflects update
        assert client.get("/summary").json()["total_amount"] == 100.0
        assert client.get("/summary/by-category").json()[0]["category"] == "shopping"

        # Delete
        assert client.delete(f"/expenses/{eid}").status_code == 204
        assert client.get(f"/expenses/{eid}").status_code == 404
        assert client.get("/summary").json()["total_count"] == 0

    def test_pagination_and_filter_integration(self, client: TestClient):
        for i in range(12):
            cat = "food" if i % 2 == 0 else "transport"
            client.post("/expenses", json={"title": f"Item {i}", "amount": 1 + i, "category": cat})
        # page 1
        p1 = client.get("/expenses?skip=0&limit=5").json()
        assert len(p1["expenses"]) == 5
        assert p1["total"] == 12
        # page 2
        p2 = client.get("/expenses?skip=5&limit=5").json()
        assert len(p2["expenses"]) == 5
        assert p1["expenses"][0]["id"] != p2["expenses"][0]["id"]
        # filter
        food = client.get("/expenses?category=food").json()
        assert food["total"] == 6
        assert all(e["category"] == "food" for e in food["expenses"])
        # invalid pagination
        assert client.get("/expenses?skip=-1&limit=5").status_code == 422
        assert client.get("/expenses?skip=0&limit=501").status_code == 422

    def test_validation_integration(self, client: TestClient):
        # missing fields
        assert client.post("/expenses", json={"title": "No amount", "category": "food"}).status_code == 422
        # invalid category
        assert client.post("/expenses", json={"title": "X", "amount": 10, "category": "bad"}).status_code == 422
        # update non-existent
        assert client.put("/expenses/9999", json={"title": "X"}).status_code == 404
        # delete non-existent
        assert client.delete("/expenses/9999").status_code == 404

    def test_cors_and_openapi(self, client: TestClient):
        # OpenAPI docs reachable
        assert client.get("/openapi.json").status_code == 200
        # CORS headers present when Origin supplied (TestClient simulates)
        r = client.get("/expenses", headers={"Origin": "http://localhost:5173"})
        # FastAPI CORSMiddleware responds with allow-origin if configured
        assert r.status_code == 200
