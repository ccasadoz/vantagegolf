import os
import json
import secrets
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import mercadopago
import db

load_dotenv()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "VgPr0$h0p-X7k9")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

admin_tokens: dict[str, float] = {}
TOKEN_EXPIRY_HOURS = 8


@app.on_event("startup")
def startup():
    db.init_db()
    cleaned = db.cleanup_stale_orders(30)
    if cleaned:
        print(f"Cleaned up {cleaned} stale orders, stock restored.")


def verify_admin(authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    expiry = admin_tokens.get(token)
    if not expiry or time.time() > expiry:
        admin_tokens.pop(token, None)
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


class LoginRequest(BaseModel):
    password: str

class PreferenceRequest(BaseModel):
    items: list[dict]
    customer_email: str = ""
    delivery_method: str = "shipping"

class ProductData(BaseModel):
    category: str
    name: str
    price: int
    stock: int
    img: str = ""
    specs: list[str] = []

class StockUpdate(BaseModel):
    stock: int

class CancelRequest(BaseModel):
    order_id: str


# --- Public ---
@app.get("/products")
def list_products():
    return db.get_all_products()


@app.post("/create-preference")
def create_preference(req: PreferenceRequest):
    # Calculate total server-side
    total = 0
    mp_items = []
    for item in req.items:
        product = db.get_product(item["id"])
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto ID {item['id']} no encontrado")
        total += product["price"] * item["qty"]
        mp_items.append({
            "title": product["name"],
            "quantity": item["qty"],
            "unit_price": product["price"],
            "currency_id": "CLP",
        })

    # Add 19% IVA
    tax = round(total * 0.19)
    # Shipping
    shipping = 0 if (req.delivery_method == "pickup" or total > 500000) else 5000
    grand_total = total + tax + shipping

    # Add tax as line item
    if tax > 0:
        mp_items.append({"title": "IVA (19%)", "quantity": 1, "unit_price": tax, "currency_id": "CLP"})
    if shipping > 0:
        mp_items.append({"title": "Envío Premium", "quantity": 1, "unit_price": shipping, "currency_id": "CLP"})

    # Decrement stock atomically
    success, error_msg = db.decrement_stock(req.items)
    if not success:
        raise HTTPException(status_code=409, detail=error_msg)

    # Generate internal order ID
    order_id = f"VG-{secrets.token_hex(4).upper()}"

    try:
        preference_data = {
            "items": mp_items,
            "back_urls": {
                "success": f"{FRONTEND_URL}?status=approved&order_id={order_id}",
                "failure": f"{FRONTEND_URL}?status=rejected&order_id={order_id}",
                "pending": f"{FRONTEND_URL}?status=pending&order_id={order_id}",
            },
            "auto_return": "approved",
            "external_reference": order_id,
            "payer": {
                "email": req.customer_email or "test@test.com",
            },
        }

        result = sdk.preference().create(preference_data)
        pref = result["response"]

        db.create_order(order_id, req.items, grand_total, req.customer_email)

        return {
            "preference_id": pref["id"],
            "init_point": pref["init_point"],
            "sandbox_init_point": pref.get("sandbox_init_point", pref["init_point"]),
            "order_id": order_id,
            "total": grand_total,
        }
    except Exception as e:
        db.restore_stock(req.items)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/confirm-order")
def confirm_order(data: dict):
    order_id = data.get("order_id", "")
    if order_id:
        db.confirm_order(order_id)
    return {"status": "confirmed"}


@app.post("/cancel-payment")
def cancel_payment(req: CancelRequest):
    conn = db.get_conn()
    order = conn.execute("SELECT items, status FROM orders WHERE id = ?", (req.order_id,)).fetchone()
    conn.close()
    if order and order["status"] == "pending":
        items = json.loads(order["items"])
        db.restore_stock(items)
        conn = db.get_conn()
        conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (req.order_id,))
        conn.commit()
        conn.close()
    return {"status": "cancelled"}


# --- Admin auth ---
@app.post("/admin/login")
def admin_login(req: LoginRequest):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    token = secrets.token_urlsafe(32)
    admin_tokens[token] = time.time() + TOKEN_EXPIRY_HOURS * 3600
    return {"token": token}


@app.get("/admin/products")
def admin_list_products(authorization: str | None = Header(None)):
    verify_admin(authorization)
    return db.get_all_products()


@app.post("/admin/products")
def admin_create_product(data: ProductData, authorization: str | None = Header(None)):
    verify_admin(authorization)
    product_id = db.upsert_product(data.model_dump())
    return {"id": product_id, "status": "created"}


@app.put("/admin/products/{product_id}")
def admin_update_product(product_id: int, data: ProductData, authorization: str | None = Header(None)):
    verify_admin(authorization)
    if not db.get_product(product_id):
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.upsert_product(data.model_dump(), product_id)
    return {"id": product_id, "status": "updated"}


@app.put("/admin/products/{product_id}/stock")
def admin_update_stock(product_id: int, data: StockUpdate, authorization: str | None = Header(None)):
    verify_admin(authorization)
    if not db.get_product(product_id):
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.update_stock(product_id, data.stock)
    return {"id": product_id, "stock": data.stock}


@app.delete("/admin/products/{product_id}")
def admin_delete_product(product_id: int, authorization: str | None = Header(None)):
    verify_admin(authorization)
    if not db.get_product(product_id):
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete_product(product_id)
    return {"id": product_id, "status": "deleted"}


@app.get("/admin/orders")
def admin_list_orders(authorization: str | None = Header(None)):
    verify_admin(authorization)
    return db.get_recent_orders()
