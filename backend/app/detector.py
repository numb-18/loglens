import json
import os
import re
from collections import defaultdict
from typing import List, Dict, Any, Optional

SIGNATURES_FILE = os.path.join(os.path.dirname(__file__), "signatures.json")

class ThreatDetector:
    def __init__(self, signatures_path: str = SIGNATURES_FILE):
        self.signatures = []
        self._load_signatures(signatures_path)

    def _load_signatures(self, path: str):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Signatures file not found at: {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data.get("signatures", []):
            try:
                self.signatures.append({
                    "id": item["id"],
                    "type": item["type"],
                    "severity": item["severity"],
                    "regex": re.compile(item["pattern"]),
                    "target": item.get("target", "path"),
                    "description": item.get("description", "")
                })
            except re.error as e:
                print(f"Error compiling pattern {item.get('pattern')}: {e}")

    def inspect_entry(self, entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Check a single parsed log line against all signatures.
        Returns a list of detected threats.
        """
        detected_threats = []
        path_to_check = entry.get("decoded_path") or entry.get("path") or ""
        raw_path = entry.get("path") or ""
        user_agent = entry.get("user_agent") or ""

        for sig in self.signatures:
            target_val = ""
            if sig["target"] == "path":
                # Check both raw path and decoded path (to catch URL-encoded attacks)
                target_val = f"{path_to_check} {raw_path}"
            elif sig["target"] == "user_agent":
                target_val = user_agent

            if target_val and sig["regex"].search(target_val):
                detected_threats.append({
                    "id": sig["id"],
                    "type": sig["type"],
                    "severity": sig["severity"],
                    "description": sig["description"]
                })

        return detected_threats

class LogAggregator:
    """
    Aggregates log entries and detected threats to generate SIEM report.
    """
    def __init__(self, brute_force_threshold: int = 5):
        self.detector = ThreatDetector()
        self.brute_force_threshold = brute_force_threshold

        self.total_requests = 0
        self.total_bytes = 0
        self.status_codes = defaultdict(int)

        # Threat tracking
        self.threat_entries = [] # Flagged log lines with threat metadata
        self.ip_stats = defaultdict(lambda: {
            "total_requests": 0,
            "threat_count": 0,
            "failed_auth_count": 0,
            "attack_types": set(),
            "first_seen": None,
            "last_seen": None
        })
        self.attacks_by_hour = defaultdict(int)
        self.attack_types_count = defaultdict(int)
        self.severity_count = defaultdict(int)

    def process_entry(self, entry: Dict[str, Any]):
        self.total_requests += 1
        self.total_bytes += entry.get("bytes_sent", 0)

        ip = entry["ip"]
        status = entry["status_code"]
        timestamp = entry["timestamp"]

        self.status_codes[str(status)] += 1

        # Track IP activity
        ip_info = self.ip_stats[ip]
        ip_info["total_requests"] += 1
        if not ip_info["first_seen"]:
            ip_info["first_seen"] = timestamp
        ip_info["last_seen"] = timestamp

        # Check for 401 Unauthorized (for brute force tracking)
        if status in (401, 403):
            ip_info["failed_auth_count"] += 1

        # Signature-based threat detection
        threats = self.detector.inspect_entry(entry)

        if threats:
            # Pick highest severity
            severities = [t["severity"] for t in threats]
            top_severity = "critical" if "critical" in severities else ("high" if "high" in severities else "medium")

            for t in threats:
                self.attack_types_count[t["type"]] += 1
                ip_info["attack_types"].add(t["type"])

            self.severity_count[top_severity] += 1
            ip_info["threat_count"] += len(threats)

            # Extract hour for timeline (e.g. "2026-09-10 14:00")
            hour_bucket = "Unknown"
            if timestamp:
                hour_bucket = timestamp[:13] + ":00" if len(timestamp) >= 13 else timestamp
            self.attacks_by_hour[hour_bucket] += 1

            self.threat_entries.append({
                **entry,
                "threats": threats,
                "severity": top_severity
            })

    def finalize(self) -> Dict[str, Any]:
        """
        Perform second-pass heuristics (like Brute Force detection) and format final SIEM response.
        """
        # Brute Force Heuristic
        for ip, stats in self.ip_stats.items():
            if stats["failed_auth_count"] >= self.brute_force_threshold:
                stats["threat_count"] += stats["failed_auth_count"]
                stats["attack_types"].add("Brute Force / Auth Failure")
                self.attack_types_count["Brute Force"] += stats["failed_auth_count"]
                self.severity_count["high"] += 1

        # Format Top Malicious IPs
        top_attackers = []
        for ip, stats in self.ip_stats.items():
            if stats["threat_count"] > 0:
                top_attackers.append({
                    "ip": ip,
                    "threat_count": stats["threat_count"],
                    "total_requests": stats["total_requests"],
                    "attack_types": list(stats["attack_types"]),
                    "first_seen": stats["first_seen"],
                    "last_seen": stats["last_seen"]
                })

        top_attackers.sort(key=lambda x: x["threat_count"], reverse=True)

        # Timeline sorted chronologically
        sorted_timeline = [
            {"hour": hour, "count": count}
            for hour, count in sorted(self.attacks_by_hour.items())
        ]

        # Attack types distribution
        attack_distribution = [
            {"type": k, "count": v}
            for k, v in sorted(self.attack_types_count.items(), key=lambda x: x[1], reverse=True)
        ]

        total_threats = sum(self.severity_count.values())

        return {
            "summary": {
                "total_requests": self.total_requests,
                "total_threats": total_threats,
                "total_bytes": self.total_bytes,
                "unique_ips": len(self.ip_stats),
                "malicious_ips": len(top_attackers),
                "severity_breakdown": dict(self.severity_count),
                "status_codes": dict(self.status_codes)
            },
            "timeline": sorted_timeline,
            "attack_types": attack_distribution,
            "top_attackers": top_attackers[:20], # Top 20 attackers
            "flagged_entries": self.threat_entries[-100:] # Last 100 threats for detailed explorer
        }
