"""
Local SQLite persistence layer for SwasthyaSaathi.
Persists completed visits, sync queue, ASHA records, and local notes.
"""
import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = "data/swasthyasaathi.db"

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Completed visits table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS completed_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        due_item TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        asha_id TEXT NOT NULL,
        notes TEXT,
        sync_status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Sync Queue table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    conn.commit()
    conn.close()

def record_visit_completion(member_id: str, due_item: str, asha_id: str = "ASHA-01", notes: str = "") -> int:
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO completed_visits (member_id, due_item, completed_date, asha_id, notes, sync_status)
    VALUES (?, ?, date('now'), ?, ?, 'PENDING')
    """, (member_id, due_item, asha_id, notes))
    visit_id = cursor.lastrowid

    # Also enqueue in sync queue
    cursor.execute("""
    INSERT INTO sync_queue (action_type, payload, status)
    VALUES ('VISIT_COMPLETED', ?, 'PENDING')
    """, (f'{{"member_id": "{member_id}", "due_item": "{due_item}", "asha_id": "{asha_id}"}}',))

    conn.commit()
    conn.close()
    return visit_id

def get_completed_visits() -> List[Dict[str, Any]]:
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM completed_visits ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_pending_sync_count() -> int:
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sync_queue WHERE status = 'PENDING'")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def sync_pending_records() -> int:
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sync_queue SET status = 'SYNCED', synced_at = CURRENT_TIMESTAMP WHERE status = 'PENDING'")
    synced_count = cursor.rowcount
    cursor.execute("UPDATE completed_visits SET sync_status = 'SYNCED' WHERE sync_status = 'PENDING'")
    conn.commit()
    conn.close()
    return synced_count
