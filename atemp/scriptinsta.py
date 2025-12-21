import json, os, re
import requests

JSON_PATH = "Thunderbit_d61619_20251219_135545.json"
OUT_DIR = "media_mrletreros"
os.makedirs(OUT_DIR, exist_ok=True)

def safe_name(s, maxlen=80):
    s = re.sub(r"[^a-zA-Z0-9_-]+", "_", (s or "")).strip("_")
    return (s[:maxlen] or "item")

def normalize_urls(value):
    """Acepta lista o string con URLs separadas por saltos/espacios."""
    if not value:
        return []
    if isinstance(value, list):
        return [u for u in value if isinstance(u, str) and u.startswith("http")]
    if isinstance(value, str):
        # Extrae cualquier http(s)://.... hasta el próximo espacio/salto de línea
        return re.findall(r"https?://\S+", value)
    return []

def download(url, dest):
    r = requests.get(url, stream=True, timeout=30, headers={
        "User-Agent": "Mozilla/5.0"
    })
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(1024 * 256):
            if chunk:
                f.write(chunk)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

for i, post in enumerate(data, start=1):
    desc = post.get("Description", "") or ""
    base = f"{i:03d}_" + safe_name(desc)

    photos = normalize_urls(post.get("Photos"))
    videos = normalize_urls(post.get("Videos"))

    for j, url in enumerate(photos, start=1):
        path = os.path.join(OUT_DIR, f"{base}_p{j}.jpg")
        try:
            download(url, path)
            print("OK", path)
        except Exception as e:
            print("FAIL PHOTO", url, e)

    for j, url in enumerate(videos, start=1):
        path = os.path.join(OUT_DIR, f"{base}_v{j}.mp4")
        try:
            download(url, path)
            print("OK", path)
        except Exception as e:
            print("FAIL VIDEO", url, e)
