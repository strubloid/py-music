"""
Error logging utility for the Strubloid Music Theory app.
Appends errors to /data/errors.md with timestamp, type, and details.
"""
from pathlib import Path
from datetime import datetime, timezone
import traceback

ERRORS_FILE = Path(__file__).parent.parent.parent.parent / "data" / "errors.md"

# Ensure data directory exists
ERRORS_FILE.parent.mkdir(parents=True, exist_ok=True)


def _timestamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def log_error(category: str, message: str, details: str | None = None, exc: BaseException | None = None):
    """
    Append an error entry to /data/errors.md.

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
        ERRORS_FILE.write_text(ERRORS_FILE.read_text() + text, encoding="utf-8")
    except FileNotFoundError:
        ERRORS_FILE.write_text(text, encoding="utf-8")

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
