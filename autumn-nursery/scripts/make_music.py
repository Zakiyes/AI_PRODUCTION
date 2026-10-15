"""Autumn lullaby: soft piano arpeggios + warm pad + music-box melody, 45 s.

Fully synthesized with numpy (no samples, no copyright). Usage:
    python3 scripts/make_music.py public/autumn-lullaby.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 45.0
BPM = 66
BEAT = 60.0 / BPM
BAR = BEAT * 4
N = int(SR * DUR)
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def piano(freq, length, vel):
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    b = 0.0004  # slight inharmonicity
    for k in range(1, 9):
        fk = freq * k * np.sqrt(1 + b * k * k)
        if fk > 9000:
            break
        amp = (1.0 / k ** 1.6) * (0.55 + 0.45 * vel)
        decay = 2.2 + 1.4 * k * (freq / 440)  # upper partials die faster
        out += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-decay * t)
    attack = np.minimum(1, t / 0.006)
    body = 0.85 * np.exp(-0.9 * t) + 0.15
    return out * attack * body * vel


def music_box(freq, length, vel):
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1.0, 1.6), (2.0, 0.25, 3.0), (2.76, 0.32, 4.5), (5.4, 0.12, 7.0)):
        out += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-dec * t)
    return out * np.minimum(1, t / 0.003) * vel


def pad(freqs, length):
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            for k in range(1, 6):
                out += (1 / k ** 2.2) * np.sin(2 * np.pi * ff * k * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / 1.6) * np.minimum(1, (length - t) / 1.4)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 0.25 * t)
    return out * np.clip(env, 0, 1) * trem


def add(buf, sig, start, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i : i + len(sig)] += sig * l
    buf[1, i : i + len(sig)] += sig * r


# Chords as MIDI notes (bass, then voicing). F major lullaby.
F, Em, Dm, C, Bb, Am, Gm = (
    [41, 53, 57, 60, 64],
    [40, 52, 55, 59, 62],
    [38, 50, 53, 57, 60],
    [36, 48, 52, 55, 59],
    [34, 46, 50, 53, 57],
    [33, 45, 48, 52, 55],
    [31, 43, 46, 50, 53],
)
progression = [F, Em, Dm, C, Bb, Am, Gm, C, F, Em, Dm, Bb]

dry = np.zeros((2, N))

# Piano arpeggios: 8 eighth notes per bar, a gentle rising/falling figure.
pattern = [0, 2, 3, 4, 3, 2, 4, 3]
for bi, ch in enumerate(progression):
    t0 = bi * BAR + 0.4
    # last bar: just a soft rolled chord that rings out
    if bi == len(progression) - 1:
        for j, n in enumerate(ch):
            add(dry, piano(midi(n), 6.0, 0.5 - j * 0.04), t0 + j * 0.11, -0.3 + j * 0.15)
        add(dry, piano(midi(F[0]), 6.0, 0.45), t0 + BAR, -0.2)
        for j, n in enumerate(F[1:]):
            add(dry, piano(midi(n + 12), 5.0, 0.3), t0 + BAR + 0.15 + j * 0.16, 0.1 + j * 0.1)
        break
    add(dry, piano(midi(ch[0]), BAR + 1.0, 0.55), t0, -0.25)
    for s, idx in enumerate(pattern):
        v = 0.34 + 0.08 * np.sin(s / 7 * np.pi) + rng.uniform(-0.03, 0.03)
        jitter = rng.uniform(-0.012, 0.012)  # human timing
        add(dry, piano(midi(ch[idx] + (12 if s in (3, 6) else 0)), 2.5, v), t0 + s * BEAT / 2 + jitter, 0.15)

# Warm pad under everything.
pad_buf = np.zeros((2, N))
for bi, ch in enumerate(progression):
    t0 = bi * BAR + 0.4
    length = BAR + 1.2 if bi < len(progression) - 1 else 7.5
    add(pad_buf, pad([midi(n) for n in ch[1:4]], length), t0 - 0.3, 0.0)
dry += pad_buf * 0.035

# Music-box melody (enters on bar 3, the "leaf" moment, sparse and tender).
mel = [
    # (bar, beat, midi, beats)
    (2, 0, 77, 1.5), (2, 1.5, 76, 0.5), (2, 2, 74, 2),
    (3, 0, 72, 1.5), (3, 1.5, 74, 0.5), (3, 2, 76, 2),
    (4, 0, 77, 1), (4, 1, 76, 1), (4, 2, 74, 1), (4, 3, 72, 1),
    (5, 0, 72, 2), (5, 2, 69, 2),
    (6, 0, 70, 1.5), (6, 1.5, 72, 0.5), (6, 2, 74, 2),
    (7, 0, 72, 3), (7, 3, 67, 1),
    (8, 0, 69, 1.5), (8, 1.5, 72, 0.5), (8, 2, 77, 2),
    (9, 0, 76, 1.5), (9, 1.5, 74, 0.5), (9, 2, 72, 2),
    (10, 0, 74, 1), (10, 1, 72, 1), (10, 2, 69, 2),
    (11, 0, 72, 4),
]
for bar, beat, n, dur in mel:
    add(dry, music_box(midi(n), 3.5, 0.16), bar * BAR + 0.4 + beat * BEAT, 0.35)

# Soft "air" (filtered noise) — autumn breeze bed, very quiet.
noise = rng.standard_normal(N)
spec = np.fft.rfft(noise)
freqs = np.fft.rfftfreq(N, 1 / SR)
spec *= 1 / (1 + (freqs / 600) ** 2)
air = np.fft.irfft(spec, N)
air /= np.abs(air).max()
t = np.arange(N) / SR
air *= 0.012 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 9.0))
dry[0] += air
dry[1] += np.roll(air, 2000)

# Convolution reverb with a synthetic stereo tail.
def reverb_ir(seed):
    r = np.random.default_rng(seed)
    L = int(3.2 * SR)
    tt = np.arange(L) / SR
    ir = r.standard_normal(L) * np.exp(-tt / 0.9)
    s = np.fft.rfft(ir)
    s *= 1 / (1 + (np.fft.rfftfreq(L, 1 / SR) / 4500) ** 2)  # dark tail
    ir = np.fft.irfft(s, L)
    ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    return ir / np.sqrt((ir ** 2).sum())


def fftconv(x, h):
    n = len(x) + len(h) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[: len(x)]


wet = np.stack([fftconv(dry[0], reverb_ir(1)), fftconv(dry[1], reverb_ir(2))])
mix = 0.72 * dry + 0.55 * wet

# Fades + gentle limiting.
fade_in = np.minimum(1, t / 2.0)
fade_out = np.clip((DUR - t) / 4.0, 0, 1) ** 1.5
mix *= fade_in * fade_out
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.1) / np.tanh(1.1) * 0.85

out = (mix.T * 32767).astype(np.int16)
path = sys.argv[1] if len(sys.argv) > 1 else "autumn-lullaby.wav"
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("wrote", path)
