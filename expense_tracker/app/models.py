from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from .database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title: str = Column(String(255), nullable=False)
    description: str = Column(String(500), default="")
    amount: float = Column(Float, nullable=False)
    category: str = Column(String(100), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
