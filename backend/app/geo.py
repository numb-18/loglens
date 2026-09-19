import ipaddress
from typing import Dict, Any, Optional

# Sample realistic IP to country mappings for known demo/attacker subnets
DEMO_IP_MAP = {
    "185.220.101.5": {"country": "Germany", "code": "DE", "city": "Frankfurt"},
    "45.154.255.88": {"country": "Russia", "code": "RU", "city": "Moscow"},
    "198.51.100.42": {"country": "United States", "code": "US", "city": "Ashburn"},
    "203.0.113.195": {"country": "China", "code": "CN", "city": "Beijing"},
    "103.251.167.20": {"country": "India", "code": "IN", "city": "Bengaluru"},
    "194.26.29.112": {"country": "Netherlands", "code": "NL", "city": "Amsterdam"},
    "141.98.10.30": {"country": "Lithuania", "code": "LT", "city": "Vilnius"},
    "91.240.118.172": {"country": "Seychelles", "code": "SC", "city": "Victoria"},
}

def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private or ip.is_loopback or ip.is_reserved
    except ValueError:
        return False

def get_ip_location(ip_str: str) -> Dict[str, str]:
    """
    Resolves an IP to a country and country code.
    Works offline using internal database and private IP detection.
    """
    if not ip_str or is_private_ip(ip_str):
        return {
            "country": "Local / Internal Network",
            "code": "LAN",
            "city": "Internal"
        }

    # Check exact demo IP match
    if ip_str in DEMO_IP_MAP:
        return DEMO_IP_MAP[ip_str]

    # Heuristic fallback based on IP first octet for offline demo realism
    try:
        first_octet = int(ip_str.split(".")[0])
        if 1 <= first_octet <= 50:
            return {"country": "United States", "code": "US", "city": "New York"}
        elif 51 <= first_octet <= 100:
            return {"country": "United Kingdom", "code": "GB", "city": "London"}
        elif 101 <= first_octet <= 150:
            return {"country": "Germany", "code": "DE", "city": "Frankfurt"}
        elif 151 <= first_octet <= 200:
            return {"country": "Japan", "code": "JP", "city": "Tokyo"}
        else:
            return {"country": "Singapore", "code": "SG", "city": "Singapore"}
    except Exception:
        return {"country": "Unknown", "code": "UN", "city": "Unknown"}
