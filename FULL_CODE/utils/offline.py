"""
Offline Status and Capability Verification Utilities.
"""
import socket

def check_internet_connection(host: str = "8.8.8.8", port: int = 53, timeout: float = 1.0) -> bool:
    """
    Checks whether active WAN connectivity is available.
    Returns False in true offline environments.
    """
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except socket.error:
        return False

def get_offline_mode_info() -> dict:
    return {
        "offline_first": True,
        "local_storage": "SQLite + IndexedDB",
        "retrieval": "BM25 Leaf-Section Index",
        "safety_engine": "Deterministic Regex Gate (ESC-v1)",
        "external_api_required": False
    }
