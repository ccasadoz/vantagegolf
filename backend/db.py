import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "vantage.db")

INITIAL_PRODUCTS = [
    (1, "Hierros", "Apex Pro Forged", 1190000, 4, "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=400", '["Acero","Grafito"]'),
    (2, "Drivers", "Vantage Z1 Stealth", 570000, 2, "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=400", '["9.5°","10.5°"]'),
    (3, "Putters", "Midnight Blade CNC", 330000, 0, "https://images.unsplash.com/photo-1592919010384-d730d2ed1f1e?q=80&w=400", '["33\\"","34\\"","35\\""]'),
    (4, "Pelotas", "Tour Flight V1 (Doce)", 52000, 24, "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=400", '["Blanco","Amarillo Neón"]'),
    (5, "Wedges", "Grind Master 56°", 180000, 8, "https://images.unsplash.com/photo-1622398925373-3f91b13f8cd2?q=80&w=400", '["S-Grind","M-Grind"]'),
    (6, "Accesorios", "Tee Premium (Pack 20)", 200, 99, "https://images.unsplash.com/photo-1595429035839-c99c298ffdde?q=80&w=400", '["Madera","Plástico"]'),
]


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            img TEXT,
            specs TEXT DEFAULT '[]'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            total INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            customer_email TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    # Seed if empty
    count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        conn.executemany(
            "INSERT INTO products (id, category, name, price, stock, img, specs) VALUES (?, ?, ?, ?, ?, ?, ?)",
            INITIAL_PRODUCTS,
        )
    conn.commit()
    conn.close()


def get_all_products():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM products ORDER BY id").fetchall()
    conn.close()
    return [_row_to_product(r) for r in rows]


def get_product(product_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    return _row_to_product(row) if row else None


def upsert_product(data: dict, product_id: int | None = None):
    conn = get_conn()
    specs = json.dumps(data.get("specs", []))
    if product_id:
        conn.execute(
            "UPDATE products SET category=?, name=?, price=?, stock=?, img=?, specs=? WHERE id=?",
            (data["category"], data["name"], data["price"], data["stock"], data.get("img", ""), specs, product_id),
        )
    else:
        cur = conn.execute(
            "INSERT INTO products (category, name, price, stock, img, specs) VALUES (?, ?, ?, ?, ?, ?)",
            (data["category"], data["name"], data["price"], data["stock"], data.get("img", ""), specs),
        )
        product_id = cur.lastrowid
    conn.commit()
    conn.close()
    return product_id


def update_stock(product_id: int, new_stock: int):
    conn = get_conn()
    conn.execute("UPDATE products SET stock = ? WHERE id = ?", (new_stock, product_id))
    conn.commit()
    conn.close()


def delete_product(product_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()


def decrement_stock(items: list[dict]) -> tuple[bool, str]:
    """Atomically decrement stock for a list of {id, qty}. Returns (success, error_message)."""
    conn = get_conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        for item in items:
            row = conn.execute("SELECT stock, name FROM products WHERE id = ?", (item["id"],)).fetchone()
            if not row:
                conn.rollback()
                return False, f"Producto ID {item['id']} no encontrado"
            if row["stock"] < item["qty"]:
                conn.rollback()
                return False, f"Stock insuficiente para '{row['name']}': quedan {row['stock']}, pediste {item['qty']}"
        for item in items:
            conn.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (item["qty"], item["id"]))
        conn.commit()
        return True, ""
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()


def restore_stock(items: list[dict]):
    conn = get_conn()
    for item in items:
        conn.execute("UPDATE products SET stock = stock + ? WHERE id = ?", (item["qty"], item["id"]))
    conn.commit()
    conn.close()


def create_order(order_id: str, items: list, total: int, email: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO orders (id, items, total, status, customer_email) VALUES (?, ?, ?, 'pending', ?)",
        (order_id, json.dumps(items), total, email),
    )
    conn.commit()
    conn.close()


def confirm_order(order_id: str):
    conn = get_conn()
    conn.execute("UPDATE orders SET status = 'confirmed' WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()


def get_recent_orders(limit: int = 50):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def cleanup_stale_orders(minutes: int = 30):
    """Restore stock for pending orders older than N minutes."""
    conn = get_conn()
    stale = conn.execute(
        "SELECT id, items FROM orders WHERE status = 'pending' AND created_at < datetime('now', ?)",
        (f"-{minutes} minutes",),
    ).fetchall()
    for order in stale:
        items = json.loads(order["items"])
        for item in items:
            conn.execute("UPDATE products SET stock = stock + ? WHERE id = ?", (item["qty"], item["id"]))
        conn.execute("UPDATE orders SET status = 'expired' WHERE id = ?", (order["id"],))
    conn.commit()
    conn.close()
    return len(stale)


def _row_to_product(row):
    return {
        "id": row["id"],
        "category": row["category"],
        "name": row["name"],
        "price": row["price"],
        "stock": row["stock"],
        "img": row["img"],
        "specs": json.loads(row["specs"]),
    }
