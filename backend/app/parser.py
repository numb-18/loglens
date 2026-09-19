import re
import urllib.parse
from datetime import datetime
from typing import Generator, Dict, Any, Optional

# Regular expression matching Nginx/Apache Combined Log Format and Common Log Format (CLF)
# Example: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://example.com" "Mozilla/5.0..."
LOG_PATTERN = re.compile(
    r'^(?P<ip>\S+)\s+'                # Remote host IP
    r'(?P<ident>\S+)\s+'              # RFC 1413 identity
    r'(?P<authuser>\S+)\s+'           # Authenticated user
    r'\[(?P<timestamp>[^\]]+)\]\s+'   # Date and time in brackets
    r'"(?:(?P<method>[A-Z]+)\s+(?P<path>\S+)(?:\s+(?P<protocol>[^"]+))?|-)"\s+' # Request line
    r'(?P<status>\d{3})\s+'           # Status code
    r'(?P<bytes>\S+)'                 # Bytes sent (or '-')
    r'(?:\s+"(?P<referer>[^"]*)"\s+'  # Referer (Combined format)
    r'"(?P<user_agent>[^"]*)")?'      # User-Agent (Combined format)
)

DATE_FORMAT = "%d/%b/%Y:%H:%M:%S %z"

def parse_line(line: str, line_number: int = 0) -> Optional[Dict[str, Any]]:
    """
    Parse a single log line into structured fields.
    Returns None if line does not match or is empty/corrupt.
    """
    line_clean = line.strip()
    if not line_clean:
        return None

    match = LOG_PATTERN.match(line_clean)
    if not match:
        return None

    data = match.groupdict()

    # Parse timestamp
    raw_timestamp = data.get("timestamp") or ""
    parsed_dt = None
    iso_timestamp = None
    try:
        # Some logs have +0000 or -0700, some don't
        if " " in raw_timestamp:
            parsed_dt = datetime.strptime(raw_timestamp, DATE_FORMAT)
        else:
            parsed_dt = datetime.strptime(raw_timestamp, "%d/%b/%Y:%H:%M:%S")
        iso_timestamp = parsed_dt.isoformat()
    except Exception:
        iso_timestamp = raw_timestamp

    # URL decode the path to reveal obfuscated injection attacks like %27%20OR%201%3D1
    raw_path = data.get("path") or ""
    try:
        decoded_path = urllib.parse.unquote_plus(raw_path)
    except Exception:
        decoded_path = raw_path

    try:
        status_code = int(data.get("status") or 0)
    except ValueError:
        status_code = 0

    try:
        bytes_sent = int(data.get("bytes")) if data.get("bytes") and data.get("bytes") != "-" else 0
    except ValueError:
        bytes_sent = 0

    return {
        "line_number": line_number,
        "ip": data.get("ip") or "0.0.0.0",
        "timestamp_raw": raw_timestamp,
        "timestamp": iso_timestamp,
        "method": data.get("method") or "UNKNOWN",
        "path": raw_path,
        "decoded_path": decoded_path,
        "protocol": data.get("protocol") or "",
        "status_code": status_code,
        "bytes_sent": bytes_sent,
        "referer": data.get("referer") or "",
        "user_agent": data.get("user_agent") or "",
        "raw_line": line_clean
    }

def stream_parse_lines(lines_iterable) -> Generator[Dict[str, Any], None, None]:
    """
    Streaming generator to parse lines one by one without loading entire log in memory.
    Ideal for large log files.
    """
    for idx, line in enumerate(lines_iterable, start=1):
        parsed = parse_line(line, idx)
        if parsed:
            yield parsed
