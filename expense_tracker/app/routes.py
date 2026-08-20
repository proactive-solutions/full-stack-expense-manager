from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db

router = APIRouter()


@router.post("/expenses", response_model=schemas.ExpenseResponse, status_code=201)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)) -> models.Expense:
    return crud.create_expense(db=db, expense_data=expense)


@router.get("/expenses", response_model=schemas.ExpenseListResponse)
def list_expenses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    category: schemas.Category | None = None,
    db: Session = Depends(get_db),
) -> schemas.ExpenseListResponse:
    expenses, total = crud.get_expenses(
        db, skip=skip, limit=limit, category=category.value if category else None
    )
    return schemas.ExpenseListResponse(
        expenses=[schemas.ExpenseResponse.model_validate(e) for e in expenses],
        total=total,
    )


@router.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)) -> models.Expense:
    expense = crud.get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    expense: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
) -> models.Expense:
    updated = crud.update_expense(db, expense_id, expense)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    if not crud.delete_expense(db, expense_id):
        raise HTTPException(status_code=404, detail="Expense not found")


@router.get("/summary", response_model=schemas.SummaryResponse)
def get_summary(db: Session = Depends(get_db)) -> schemas.SummaryResponse:
    data = crud.get_expense_summary(db)
    return schemas.SummaryResponse(**data)


@router.get("/summary/by-category", response_model=list[schemas.CategorySummaryResponse])
def get_summary_by_category(
    db: Session = Depends(get_db),
) -> list[schemas.CategorySummaryResponse]:
    data = crud.get_expenses_by_category(db)
    return [schemas.CategorySummaryResponse(**item) for item in data]
