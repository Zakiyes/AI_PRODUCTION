"""Animatic only: turn the red/terracotta chairs of the reference photo into deep emerald velvet."""
import subprocess, sys
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(","))
img = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout, np.uint8).reshape(h, w, 3).astype(float) / 255
r, g, b = img[..., 0], img[..., 1], img[..., 2]
mx, mn = img.max(-1), img.min(-1)
sat = (mx - mn) / np.maximum(mx, 1e-6)
hue = np.where(mx == r, ((g - b) / np.maximum(mx - mn, 1e-6)) % 6, 0) * 60
# chair red/terracotta: hue 0..28, saturated, not the bright magenta-red flowers (which are lighter & bluer)
m = ((hue < 26) & (sat > 0.55) & (mx < 0.78)).astype(float)
m[: int(h * 0.40)] = 0
m *= np.clip((sat - 0.55) / 0.12, 0, 1)
lum = 0.3 * r + 0.59 * g + 0.11 * b
emerald = np.stack([0.10, 0.36, 0.25])  # deep emerald at mid luminance
green = np.clip(emerald[None, None, :] * (lum[..., None] / 0.30) ** 0.9, 0, 1)
out = img * (1 - m[..., None]) + green * m[..., None]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-i", "-", "-q:v", "2", dst], input=(out * 255).astype(np.uint8).tobytes(), check=True)
print("wrote", dst)
