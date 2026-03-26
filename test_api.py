#!/usr/bin/env python3
"""Quick smoke test of GreenGrid API endpoints."""
import requests
import sys
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test /health endpoint."""
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "ok"
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_analyze():
    """Test /analyze endpoint with a real city."""
    try:
        place = "Chennai, Tamil Nadu, India"
        resp = requests.get(f"{BASE_URL}/analyze", params={"place": place}, timeout=60)
        if resp.status_code != 200:
            print(f"✗ Analyze failed with status {resp.status_code}: {resp.text}")
            return False
        data = resp.json()
        assert "metrics" in data, "Response missing 'metrics'"
        assert "green_percent" in data["metrics"], "Metrics missing 'green_percent'"
        print(f"✓ Analyze passed — green cover: {data['metrics']['green_percent']:.1f}%")
        return True
    except Exception as e:
        print(f"✗ Analyze test failed: {e}")
        return False

def main():
    print("Running GreenGrid smoke tests...")
    print(f"Target: {BASE_URL}\n")
    
    results = [
        test_health(),
        test_analyze(),
    ]
    
    passed = sum(results)
    total = len(results)
    print(f"\n{passed}/{total} tests passed")
    return 0 if all(results) else 1

if __name__ == "__main__":
    sys.exit(main())
