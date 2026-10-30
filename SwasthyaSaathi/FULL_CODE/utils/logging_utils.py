"""
Privacy-Preserving Local Logging for SwasthyaSaathi.
Ensures zero transmission of patient identifiable data to external endpoints.
"""
import logging
import os

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "swasthyasaathi.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("SwasthyaSaathi")

def log_event(event_type: str, details: str):
    logger.info(f"[{event_type}] {details}")
