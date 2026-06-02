from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routes import products, customers, orders
from . import models

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, and sales orders.",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management API",
        "docs_url": "/docs",
        "status": "healthy"
    }

@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock is defined as quantity < 10
    low_stock_products = db.query(models.Product).filter(models.Product.quantity < 10).all()
    
    # Let's map low stock products for display
    low_stock_list = [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "quantity": p.quantity,
            "price": p.price
        }
        for p in low_stock_products
    ]
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": len(low_stock_products),
        "low_stock_products": low_stock_list
    }
