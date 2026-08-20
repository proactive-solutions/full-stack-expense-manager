from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas


def create_expense(db: Session, expense_data: schemas.ExpenseCreate) -> models.Expense:
    db_expense = models.Expense(
        title=expense_data.title,
        description=expense_data.description,
        amount=expense_data.amount,
        category=expense_data.category.value,
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def get_expense(db: Session, expense_id: int) -> models.Expense | None:
    return db.query(models.Expense).filter(models.Expense.id == expense_id).first()


def get_expenses(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
) -> tuple[list[models.Expense], int]:
    query = db.query(models.Expense)
    if category:
        query = query.filter(models.Expense.category == category)
    total: int = query.count()
    expenses: list[models.Expense] = query.offset(skip).limit(limit).all()
    return expenses, total


def update_expense(
    db: Session, expense_id: int, expense_data: schemas.ExpenseUpdate
) -> models.Expense | None:
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        return None
    update_data = expense_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "category" and value is not None:
            setattr(db_expense, field, value.value)
        else:
            setattr(db_expense, field, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int) -> bool:
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        return False
    db.delete(db_expense)
    db.commit()
    return True


def get_expense_summary(db: Session) -> dict[str, float | int]:
    result = db.query(
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("count"),
    ).first()
    total_amount: float = float(result[0]) if result[0] else 0.0
    total_count: int = result[1] if result[1] else 0
    return {"total_amount": total_amount, "total_count": total_count}


def get_expenses_by_category(db: Session) -> list[dict[str, float | int]]:
    results = (
        db.query(
            models.Expense.category,
            func.sum(models.Expense.amount).label("total"),
            func.count(models.Expense.id).label("count"),
        )
        .group_by(models.Expense.category)
        .all()
    )
    return [{"category": r[0], "total": float(r[1]), "count": r[2]} for r in results]
