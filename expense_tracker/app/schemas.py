from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class Category(StrEnum):
    FOOD = "food"
    TRANSPORT = "transport"
    ENTERTAINMENT = "entertainment"
    UTILITIES = "utilities"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    SHOPPING = "shopping"
    OTHER = "other"


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=500)
    amount: float = Field(..., gt=0)
    category: Category


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    amount: float | None = Field(default=None, gt=0)
    category: Category | None = None


class ExpenseResponse(BaseModel):
    id: int
    title: str
    description: str
    amount: float
    category: Category
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int


class SummaryResponse(BaseModel):
    total_amount: float
    total_count: int


class CategorySummaryResponse(BaseModel):
    category: str
    total: float
    count: int
