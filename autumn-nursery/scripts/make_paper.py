"""Paper grain + watercolour blotch texture (multiply overlay)."""
import subprocess, sys
import numpy as np
W, H = 1920, 1080
rng = np.random.default_rng(3)
def smooth_noise(scale):
    small = rng.standard_normal((H // scale + 2, W // scale + 2))
    ys = np.linspace(0, small.shape[0] - 1.001, H); xs = np.linspace(0, small.shape[1] - 1.001, W)
    y0 = ys.astype(int); x0 = xs.astype(int); fy = (ys - y0)[:, None]; fx = (xs - x0)[None, :]
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = small[y0][:, x0]; b = small[y0][:, x0 + 1]; c = small[y0 + 1][:, x0]; d = small[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
blot = smooth_noise(180) * 0.6 + smooth_noise(60) * 0.3 + smooth_noise(14) * 0.15
fine = rng.standard_normal((H, W))
fibre = smooth_noise(3) * 0.5
v = 1 - 0.035 * (blot - blot.min()) / (blot.max() - blot.min()) - 0.022 * np.abs(fine) - 0.015 * np.abs(fibre)
rgb = np.stack([v, v * 0.985, v * 0.96], -1)
img = (np.clip(rgb, 0, 1) * 255).astype(np.uint8)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-i", "-", sys.argv[1]], input=img.tobytes(), check=True)
print("wrote", sys.argv[1])
