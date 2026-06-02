from sqlalchemy.orm import Session
from . import models, schemas

# Custom Exceptions for clean business logic mapping in routes
class ItemNotFoundError(Exception):
    pass

class DuplicateEntryError(Exception):
    pass

class InsufficientStockError(Exception):
    pass


# --- PRODUCT CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Rule: SKU must be unique
    db_product = get_product_by_sku(db, sku=product.sku)
    if db_product:
        raise DuplicateEntryError(f"Product with SKU '{product.sku}' already exists.")
    
    # Pydantic validates quantity >= 0 and price > 0, but let's double check
    new_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise ItemNotFoundError(f"Product with ID {product_id} not found.")
    
    # Rule: SKU must be unique if updated
    if product_update.sku is not None and product_update.sku != db_product.sku:
        duplicate = get_product_by_sku(db, sku=product_update.sku)
        if duplicate:
            raise DuplicateEntryError(f"Product with SKU '{product_update.sku}' already exists.")
    
    # Update fields if provided
    for key, value in product_update.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise ItemNotFoundError(f"Product with ID {product_id} not found.")
    
    # Note: Check if product is in any orders before deletion (could trigger foreign key violation).
    # We will let the database raise an integrity error or prevent deletion if it's referenced.
    # In a professional app, it's better to prevent deleting products with existing orders.
    # We will raise a constraint exception in routes if Database integrity fails.
    db.delete(db_product)
    db.commit()
    return db_product


# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Rule: Customer email must be unique
    db_cust = get_customer_by_email(db, email=customer.email)
    if db_cust:
        raise DuplicateEntryError(f"Customer with email '{customer.email}' already exists.")
        
    new_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise ItemNotFoundError(f"Customer with ID {customer_id} not found.")
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- ORDER CRUD ---

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order.customer_id)
    if not customer:
        raise ItemNotFoundError(f"Customer with ID {order.customer_id} not found.")

    # We will build and store the list of line items, calculate the total cost, and verify stock availability
    total_amount = 0.0
    items_to_create = []
    products_to_update = []

    for item in order.items:
        product = get_product(db, item.product_id)
        if not product:
            raise ItemNotFoundError(f"Product with ID {item.product_id} not found.")
        
        # Rule: Orders cannot be placed if inventory is insufficient
        if product.quantity < item.quantity:
            raise InsufficientStockError(
                f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
            
        # Update stock quantity (Rule: Creating an order must automatically reduce available stock)
        product.quantity -= item.quantity
        products_to_update.append(product)
        
        # Calculate total price (Rule: Total order amount must be calculated automatically by backend)
        total_amount += product.price * item.quantity
        
        items_to_create.append(item)

    # Save changes inside a transaction
    try:
        # Create order
        new_order = models.Order(
            customer_id=order.customer_id,
            total_amount=total_amount
        )
        db.add(new_order)
        db.flush() # Yields the new_order.id
        
        # Create order items
        for item in items_to_create:
            new_item = models.OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            db.add(new_item)
            
        db.commit()
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int):
    # Fetch order
    db_order = get_order(db, order_id)
    if not db_order:
        raise ItemNotFoundError(f"Order with ID {order_id} not found.")
        
    # Cancel/Delete order logic:
    # Rule: Restore the stock of the ordered items when canceling/deleting an order
    try:
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity # return to inventory
                
        db.delete(db_order)
        db.commit()
        return db_order
    except Exception as e:
        db.rollback()
        raise e
