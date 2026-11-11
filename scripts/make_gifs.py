"""
Genera un GIF animado (zoom suave + destello de luz) a partir de cada foto de public/productos/*.jpg.

Uso (desde la raíz del proyecto):
    pip install pillow
    python scripts/make_gifs.py                 # todas las fotos
    python scripts/make_gifs.py cama_nido       # solo public/productos/cama_nido.jpg

Crea public/productos/gifs/<nombre>.gif. Para usarlo, el producto en src/data/products.json debe tener
    "gif": "/productos/gifs/<nombre>.gif"
Si prefieres un GIF propio (por ejemplo, de tu mascota usando el producto), guárdalo con ese mismo nombre y listo.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "productos"
OUT = SRC / "gifs"

W, H = 320, 400          # 4:5, igual que las tarjetas de la tienda (object-cover centrado)
FRAMES = 20
FRAME_MS = 80


def crop_4_5(im: Image.Image) -> Image.Image:
    """Recorta al centro con proporción 4:5, igual que hace object-cover en la tarjeta."""
    w, h = im.size
    target = W / H
    if w / h > target:
        nw = round(h * target)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = round(w / target)
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


def sweep_mask(t: float) -> Image.Image:
    """Banda diagonal de luz que cruza la imagen durante el segundo tercio de la animación."""
    mask = Image.new("L", (W, H), 0)
    if 0.35 <= t <= 0.8:
        k = (t - 0.35) / 0.45
        cx = -H * 0.3 + k * (W + H * 0.6)
        d = ImageDraw.Draw(mask)
        d.polygon([(cx - 40, 0), (cx + 10, 0), (cx - 90 + H * 0.35, H), (cx - 140 + H * 0.35, H)], fill=110)
        mask = mask.filter(ImageFilter.GaussianBlur(14))
    return mask


def make(path: Path) -> Path:
    base = crop_4_5(Image.open(path).convert("RGB"))
    big = base.resize((W * 2, H * 2), Image.LANCZOS)
    white = Image.new("RGB", (W, H), (255, 252, 235))
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        zoom = 1.0 + 0.10 * (0.5 - 0.5 * math.cos(2 * math.pi * t))   # 1.00 -> 1.10 -> 1.00 (bucle perfecto)
        sway = math.sin(2 * math.pi * t) * 10
        cw, ch = W * 2 / zoom, H * 2 / zoom
        left = min(W * 2 - cw, max(0.0, (W * 2 - cw) / 2 + sway))   # nunca fuera de la imagen
        top = (H * 2 - ch) / 2
        frame = big.resize((W, H), Image.LANCZOS, box=(left, top, left + cw, top + ch))
        frame = Image.composite(white, frame, sweep_mask(t))
        frames.append(frame.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{path.stem}.gif"
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0, optimize=True, disposal=2)
    return out


if __name__ == "__main__":
    names = sys.argv[1:]
    files = [SRC / f"{n}.jpg" for n in names] if names else sorted(SRC.glob("*.jpg"))
    for f in files:
        if not f.exists():
            print(f"No existe {f}")
            continue
        out = make(f)
        print(f"{out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB")
