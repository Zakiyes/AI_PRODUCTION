"""Mellow restaurant jazz: Rhodes-style electric piano, upright bass, brushed drums. 30 s.

Fully synthesized with numpy (no samples, no copyright). Usage:
    python3 scripts/make_music.py public/mellow-jazz.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 30.0
BPM = 76
BEAT = 60.0 / BPM
BAR = BEAT * 4
N = int(SR * DUR)
rng = np.random.default_rng(11)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def rhodes(freq, length, vel):
    t = np.arange(int(length * SR)) / SR
    # FM-ish electric piano: warm sine body + bell partial that fades fast
    mod = np.sin(2 * np.pi * freq * t) * (1.2 * np.exp(-6 * t) + 0.15)
    body = np.sin(2 * np.pi * freq * t + mod)
    bell = 0.25 * np.sin(2 * np.pi * freq * 4.0 * t) * np.exp(-9 * t)
    env = np.minimum(1, t / 0.004) * (0.7 * np.exp(-1.1 * t) + 0.3 * np.exp(-0.25 * t))
    trem = 1 + 0.06 * np.sin(2 * np.pi * 4.5 * t)
    return (body + bell) * env * trem * vel


def bass(freq, length, vel):
    t = np.arange(int(length * SR)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    env = np.minimum(1, t / 0.012) * np.exp(-2.2 * t) * np.minimum(1, (length - t) / 0.05)
    return s * np.clip(env, 0, 1) * vel


def lowpass(x, cutoff):
    s = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(s / (1 + (f / cutoff) ** 2), len(x))


def brush(length, vel, cutoff=5000):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), cutoff)
    env = np.minimum(1, t / (length * 0.35)) * np.exp(-t * 6)
    return noise * env * vel


def add(buf, sig, start, pan=0.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    buf[0, i:i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    buf[1, i:i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


# ii-V-I-vi in D major, extended voicings: Em9 A13 Dmaj9 Bm9 ...
CH = {
    'Em9': (40, [55, 59, 62, 66]),
    'A13': (45, [55, 61, 66, 71]),
    'Dmaj9': (38, [54, 57, 61, 64]),
    'Bm9': (47, [57, 61, 62, 66]),
    'Gmaj9': (43, [54, 57, 59, 62]),
    'F#7': (42, [52, 58, 61, 64]),
}
prog = ['Dmaj9', 'Bm9', 'Em9', 'A13', 'Dmaj9', 'Bm9', 'Gmaj9', 'F#7', 'Dmaj9']
dry = np.zeros((2, N))
start = 0.3
swing = BEAT * 0.62  # swung eighths

for bi, name in enumerate(prog):
    root, voicing = CH[name]
    t0 = start + bi * BAR
    last = bi == len(prog) - 1
    # Rhodes comping: on 1 and the "and" of 2 (Charleston), rolled softly
    hits = [(0, 0.42, BEAT * 1.5)] if last else [(0, 0.36, BEAT * 1.4), (BEAT + swing, 0.26, BEAT * 2.2)]
    for off, v, ln in hits:
        for j, n in enumerate(voicing):
            add(dry, rhodes(midi(n), ln + (4.0 if last else 0.6), v * (0.9 + 0.1 * rng.random())), t0 + off + j * 0.018, -0.25 + j * 0.12)
    # walking-ish bass: root, fifth, approach note
    if last:
        add(dry, bass(midi(root), 4.0, 0.55), t0, 0.0)
    else:
        nxt = CH[prog[bi + 1]][0]
        line = [root, root + 7, root + 12 if bi % 2 else root + 4, nxt + (1 if nxt < root else -1)]
        for k, n in enumerate(line):
            add(dry, bass(midi(n), BEAT * 0.95, 0.5 if k == 0 else 0.4), t0 + k * BEAT, 0.0)
    # brushes: swish on every beat, accent 2 & 4, plus swung "tick"
    if not last and bi >= 1:
        for k in range(4):
            add(dry, brush(BEAT * 0.9, 0.05 if k % 2 else 0.035), t0 + k * BEAT, 0.3)
            add(dry, brush(0.08, 0.04, 9000), t0 + k * BEAT + swing, 0.4)

# sparse melody on the electric piano, high register (enters at bar 3, peaks on the plating shot)
mel = [(2, 0, 74, 1.5), (2, 2, 76, 1), (2, 3, 78, 1), (3, 0, 76, 2.5), (4, 1, 73, 1), (4, 2, 74, 1), (4, 3, 76, 1),
       (5, 0, 78, 1.5), (5, 2, 81, 2), (6, 0, 79, 1), (6, 1, 78, 1), (6, 2, 76, 2), (7, 0, 73, 2), (7, 2, 76, 2)]
for bar, beat, n, d in mel:
    add(dry, rhodes(midi(n), BEAT * d + 1.0, 0.2), start + bar * BAR + beat * BEAT, 0.2)

# light restaurant room tone (very quiet)
room = lowpass(rng.standard_normal(N), 900)
room /= np.abs(room).max()
dry += 0.006 * np.stack([room, np.roll(room, 3000)])


def ir(seed):
    r = np.random.default_rng(seed)
    L = int(2.2 * SR)
    tt = np.arange(L) / SR
    h = lowpass(r.standard_normal(L) * np.exp(-tt / 0.55), 5000)
    return h / np.sqrt((h ** 2).sum())


def conv(x, h):
    n = len(x) + len(h) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]


wet = np.stack([conv(dry[0], ir(1)), conv(dry[1], ir(2))])
mix = 0.8 * dry + 0.35 * wet
t = np.arange(N) / SR
mix *= np.minimum(1, t / 1.0) * np.clip((DUR - t) / 2.5, 0, 1) ** 1.3
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.15) / np.tanh(1.15) * 0.85
out = (mix.T * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'mellow-jazz.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print('wrote', sys.argv[1] if len(sys.argv) > 1 else 'mellow-jazz.wav')
