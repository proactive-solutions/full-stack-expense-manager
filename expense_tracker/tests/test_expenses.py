from collections.abc import Generator

import pytest
from starlette.testclient import TestClient

from .conftest import get_test_client


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    yield from get_test_client()


class TestCreateExpense:
    def test_create_expense_success(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={
                "title": "Groceries",
                "description": "Weekly grocery shopping",
                "amount": 50.75,
                "category": "food",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Groceries"
        assert data["amount"] == 50.75
        assert data["category"] == "food"
        assert "id" in data
        assert "created_at" in data

    def test_create_expense_minimal(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={"title": "Bus ticket", "amount": 2.50, "category": "transport"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == ""

    def test_create_expense_invalid_amount(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={"title": "Negative", "amount": -10, "category": "food"},
        )
        assert response.status_code == 422

    def test_create_expense_zero_amount(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={"title": "Zero", "amount": 0, "category": "food"},
        )
        assert response.status_code == 422

    def test_create_expense_empty_title(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={"title": "", "amount": 10, "category": "food"},
        )
        assert response.status_code == 422

    def test_create_expense_invalid_category(self, client: TestClient) -> None:
        response = client.post(
            "/expenses",
            json={"title": "Test", "amount": 10, "category": "invalid_category"},
        )
        assert response.status_code == 422


class TestGetExpense:
    def test_get_expense_success(self, client: TestClient) -> None:
        create_response = client.post(
            "/expenses",
            json={"title": "Lunch", "amount": 15.00, "category": "food"},
        )
        expense_id = create_response.json()["id"]

        response = client.get(f"/expenses/{expense_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Lunch"

    def test_get_expense_not_found(self, client: TestClient) -> None:
        response = client.get("/expenses/999")
        assert response.status_code == 404


class TestListExpenses:
    def test_list_expenses_empty(self, client: TestClient) -> None:
        response = client.get("/expenses")
        assert response.status_code == 200
        data = response.json()
        assert data["expenses"] == []
        assert data["total"] == 0

    def test_list_expenses_with_data(self, client: TestClient) -> None:
        for i in range(5):
            client.post(
                "/expenses",
                json={"title": f"Expense {i}", "amount": 10.0 * (i + 1), "category": "food"},
            )
        response = client.get("/expenses")
        data = response.json()
        assert data["total"] == 5
        assert len(data["expenses"]) == 5

    def test_list_expenses_pagination(self, client: TestClient) -> None:
        for i in range(10):
            client.post(
                "/expenses",
                json={"title": f"Expense {i}", "amount": 10.0, "category": "food"},
            )
        response = client.get("/expenses?skip=0&limit=3")
        data = response.json()
        assert len(data["expenses"]) == 3
        assert data["total"] == 10

    def test_list_expenses_filter_category(self, client: TestClient) -> None:
        client.post("/expenses", json={"title": "Food", "amount": 10, "category": "food"})
        client.post("/expenses", json={"title": "Transport", "amount": 5, "category": "transport"})
        response = client.get("/expenses?category=food")
        data = response.json()
        assert data["total"] == 1
        assert data["expenses"][0]["category"] == "food"


class TestUpdateExpense:
    def test_update_expense_success(self, client: TestClient) -> None:
        create_response = client.post(
            "/expenses",
            json={"title": "Old Title", "amount": 10.00, "category": "food"},
        )
        expense_id = create_response.json()["id"]

        response = client.put(
            f"/expenses/{expense_id}",
            json={"title": "New Title", "amount": 25.00},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title"
        assert data["amount"] == 25.00

    def test_update_expense_partial(self, client: TestClient) -> None:
        create_response = client.post(
            "/expenses",
            json={"title": "Original", "amount": 10.00, "category": "food"},
        )
        expense_id = create_response.json()["id"]

        response = client.put(f"/expenses/{expense_id}", json={"amount": 20.00})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Original"
        assert data["amount"] == 20.00

    def test_update_expense_not_found(self, client: TestClient) -> None:
        response = client.put("/expenses/999", json={"title": "Test"})
        assert response.status_code == 404


class TestDeleteExpense:
    def test_delete_expense_success(self, client: TestClient) -> None:
        create_response = client.post(
            "/expenses",
            json={"title": "To Delete", "amount": 5.00, "category": "food"},
        )
        expense_id = create_response.json()["id"]

        response = client.delete(f"/expenses/{expense_id}")
        assert response.status_code == 204

        get_response = client.get(f"/expenses/{expense_id}")
        assert get_response.status_code == 404

    def test_delete_expense_not_found(self, client: TestClient) -> None:
        response = client.delete("/expenses/999")
        assert response.status_code == 404


class TestSummary:
    def test_summary_empty(self, client: TestClient) -> None:
        response = client.get("/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_amount"] == 0.0
        assert data["total_count"] == 0

    def test_summary_with_data(self, client: TestClient) -> None:
        client.post("/expenses", json={"title": "A", "amount": 10.00, "category": "food"})
        client.post("/expenses", json={"title": "B", "amount": 20.00, "category": "transport"})

        response = client.get("/summary")
        data = response.json()
        assert data["total_amount"] == 30.00
        assert data["total_count"] == 2

    def test_summary_by_category(self, client: TestClient) -> None:
        client.post("/expenses", json={"title": "A", "amount": 10.00, "category": "food"})
        client.post("/expenses", json={"title": "B", "amount": 20.00, "category": "food"})
        client.post("/expenses", json={"title": "C", "amount": 5.00, "category": "transport"})

        response = client.get("/summary/by-category")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        food_summary = next(s for s in data if s["category"] == "food")
        assert food_summary["total"] == 30.00
        assert food_summary["count"] == 2
