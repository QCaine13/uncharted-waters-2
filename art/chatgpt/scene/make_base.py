#!/usr/bin/env python3
"""Build the base image for one district: the current town render with every
already-finished district (and the approved pilot) pasted in, cropped to the
district window. Usage: make_base.py C2   (writes base/C2.png)"""
import json, sys
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
cfg = json.loads((here / "districts.json").read_text())
T = cfg["tilePx"]
W, H = (n * T for n in cfg["mapTiles"])
ww, wh = (n * T for n in cfg["windowTiles"])
town = Image.open(here / "base/town-render.png").convert("RGB").resize((W, H), Image.LANCZOS)

def paste(path, window):
    if path.exists():
        img = Image.open(path).convert("RGB")
        if img.size != (ww, wh):
            img = img.resize((ww, wh), Image.LANCZOS)
        town.paste(img, (window[0] * T, window[1] * T))

p = cfg["pilot"]
paste(here / "output" / p["file"], p["window"])
for did in cfg["order"]:
    paste(here / "output" / f"{did}.png", cfg["districts"][did]["window"])

for did in sys.argv[1:]:
    x, y = cfg["districts"][did]["window"]
    out = here / "base" / f"{did}.png"
    town.crop((x * T, y * T, x * T + ww, y * T + wh)).save(out)
    print(out)
