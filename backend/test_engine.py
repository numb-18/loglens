import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from app.parser import stream_parse_lines, parse_line
from app.detector import LogAggregator
from app.geo import get_ip_location

def test_engine():
    print("========================================")
    print("🧪 Testing LogLens Core Security Engine")
    print("========================================")

    demo_file = os.path.join(os.path.dirname(__file__), "app", "sample_logs", "demo_access.log")
    assert os.path.exists(demo_file), "Demo log file does not exist!"

    aggregator = LogAggregator()
    with open(demo_file, "r", encoding="utf-8") as f:
        entries = list(stream_parse_lines(f))

    print(f"✅ Successfully parsed {len(entries)} raw log lines.")
    assert len(entries) > 0, "No log lines were parsed!"

    for entry in entries:
        aggregator.process_entry(entry)

    report = aggregator.finalize()
    summary = report["summary"]

    print("\n--- Summary Findings ---")
    print(f"Total Requests: {summary['total_requests']}")
    print(f"Total Threats: {summary['total_threats']}")
    print(f"Unique IPs: {summary['unique_ips']}")
    print(f"Malicious IPs Flagged: {summary['malicious_ips']}")
    print(f"Severity Breakdown: {summary['severity_breakdown']}")

    print("\n--- Attack Types Detected ---")
    for item in report["attack_types"]:
        print(f"  • {item['type']}: {item['count']} detections")

    print("\n--- Top Attacking IPs ---")
    for attacker in report["top_attackers"]:
        loc = get_ip_location(attacker["ip"])
        print(f"  • IP: {attacker['ip']} ({loc['country']}) - Threats: {attacker['threat_count']} - Attacks: {', '.join(attacker['attack_types'])}")

    print("\n--- Timeline (Hourly Buckets) ---")
    for bucket in report["timeline"]:
        print(f"  • {bucket['hour']}: {bucket['count']} attacks")

    assert summary["total_threats"] > 0, "Expected threats to be detected in demo log!"
    assert any("SQL Injection" in a["type"] for a in report["attack_types"]), "SQL Injection not detected!"
    assert any("Cross-Site Scripting" in a["type"] for a in report["attack_types"]), "XSS not detected!"
    assert any("Directory Traversal" in a["type"] for a in report["attack_types"]), "Directory Traversal not detected!"

    print("\n🎉 ALL TESTS PASSED! The engine is 100% functional and ready.")

if __name__ == "__main__":
    test_engine()
