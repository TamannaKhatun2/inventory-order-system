from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db=db, order=order)
    except crud.ItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except crud.InsufficientStockError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred: {str(e)}")

@router.get("", response_model=List[schemas.OrderOut])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db=db, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=schemas.OrderOut)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order with ID {order_id} not found.")
    return db_order

@router.delete("/{order_id}", response_model=schemas.OrderOut)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        return crud.delete_order(db=db, order_id=order_id)
    except crud.ItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while deleting the order.")
