from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_customer(db=db, customer=customer)
    except crud.DuplicateEntryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while creating the customer.")

@router.get("", response_model=List[schemas.CustomerOut])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db=db, skip=skip, limit=limit)

@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with ID {customer_id} not found.")
    return db_customer

@router.delete("/{customer_id}", response_model=schemas.CustomerOut)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    try:
        return crud.delete_customer(db=db, customer_id=customer_id)
    except crud.ItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer because they are referenced in an order."
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while deleting the customer.")
