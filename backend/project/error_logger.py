"""
Error logging utility for the Strubloid Music Theory app.
Appends errors to the configured writable data directory with timestamp, type, and details.
"""
import os
from pathlib import Path
from datetime import datetime, timezone
import traceback

DATA_DIR = Path(os.getenv('PYMUSIC_DATA_DIR', Path(__file__).parents[2] / 'data'))
ERRORS_FILE = DATA_DIR / 'errors.md'


def _timestamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def log_error(category: str, message: str, details: str | None = None, exc: BaseException | None = None):
    """
    Append an error entry to the configured error log.

    Args:
        category: Short tag like "API", "AUTH", "FRONTEND", "DATABASE"
        message: One-line summary
        details: Optional multi-line context
        exc: Optional Exception object; traceback is extracted automatically.
    """
    lines = [
        "```\n\n",
        f"[{category}] {message} — {_timestamp()}",
        "",
    ]

    if exc is not None:
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        lines.extend([f"Exception: {type(exc).__name__}: {exc}", "", "Traceback:", tb.rstrip(), ""])

    if details:
        lines.extend(["Details:", str(details).rstrip(), ""])

    lines.append("```\n")

    text = "\n".join(lines) + "\n"

    try:
        ERRORS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with ERRORS_FILE.open('a', encoding='utf-8') as error_log:
            error_log.write(text)
    except OSError:
        # Logging cannot prevent the application from starting or serving errors.
        pass

    return text


def log_request_error(request, category="API"):
    """Log an HTTP request error with method, URL, and status."""
    details = (
        f"Method : {request.method}\n"
        f"URL    : {request.url}\n"
        f"Status : {getattr(request, 'status_code', 'N/A')}\n"
        f"Remote : {request.remote_addr}\n"
    )
    log_error(category, f"{request.method} {request.path} failed", details=details)
