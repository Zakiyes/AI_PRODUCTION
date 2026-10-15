"""Cut the signature out of a logo with a baked-in checkerboard background -> RGBA PNG."""
import subprocess, sys
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
W = H = 1024
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(float)
lum = img.mean(-1)
sat = img.max(-1) - img.min(-1)
# background = neutral & light (white / light-grey squares); ink = coloured or dark
a = np.clip(np.maximum((sat - 14) / 50, (215 - lum) / 70), 0, 1)
ys, xs = np.where(a > 0.3)
pad = 12
y0, y1, x0, x1 = ys.min() - pad, ys.max() + pad, xs.min() - pad, xs.max() + pad
a = a[y0:y1, x0:x1]
rgb = img[y0:y1, x0:x1]
# un-mix the light background from semi-transparent edges, then deepen colours slightly
bg = 245.0
col = np.where(a[..., None] > 0.05, (rgb - bg * (1 - a[..., None])) / np.maximum(a[..., None], 0.05), rgb)
col = np.clip(col, 0, 255)
out = np.dstack([col, a * 255]).astype(np.uint8)
h, w = out.shape[:2]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-i", "-", dst], input=out.tobytes(), check=True)
print("wrote", dst, w, h)
