from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from datetime import datetime

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    price: float = Field(..., gt=0, description="Price must be greater than zero")
    quantity: int = Field(..., ge=0, description="Quantity cannot be negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True


# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# --- ORDER ITEM SCHEMAS ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity ordered must be greater than zero")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    id: int
    product_name: Optional[str] = None
    product_price: Optional[float] = None
    product_sku: Optional[str] = None

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Order must contain at least one item")

class OrderOut(BaseModel):
    id: int
    customer_id: int
    customer: CustomerOut
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True
