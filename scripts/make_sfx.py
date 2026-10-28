"""Synthesizes every sound effect and the music bed. All audio here is generated
from scratch by this script (public domain / CC0). Run: python3 scripts/make_sfx.py"""
import wave, os
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public')
rng = np.random.default_rng(7)

def t(sec): return np.arange(int(sec * SR)) / SR

def env(n, a=0.005, r=None):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    if r is not None:
        e *= np.exp(-np.arange(n) / (r * SR))
    return e

def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (sweep)."""
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y

def highpass(x, cutoff):
    return x - lowpass(x, cutoff)

def tone(f, sec, decay=0.6, harm=0.25, a=0.008):
    tt = t(sec)
    y = np.sin(2 * np.pi * f * tt) + harm * np.sin(4 * np.pi * f * tt)
    return y * env(len(tt), a, decay)

def save(name, x, folder='sfx', peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    fade = min(len(x), int(0.004 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    os.makedirs(os.path.join(OUT, folder), exist_ok=True)
    with wave.open(os.path.join(OUT, folder, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def whoosh(sec):
    n = int(sec * SR)
    x = rng.standard_normal(n)
    sweep = np.concatenate([np.linspace(300, 3500, n // 2), np.linspace(3500, 500, n - n // 2)])
    y = lowpass(highpass(x, 150), sweep)
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return y * shape

save('whoosh_corto', whoosh(0.35))
save('whoosh_largo', whoosh(0.75))

# A short roll of counter ticks (25 per second) — one cue, not 25 sounds.
roll = np.zeros(int(1.0 * SR))
for k in range(25):
    s = int(k / 25 * SR)
    c = tone(3200, 0.012, decay=0.002, harm=0) * (0.7 + 0.3 * rng.random())
    roll[s:s + len(c)] += c
save('tick_roll', roll, peak=0.6)

tt = t(0.22)
save('pop_grave', np.sin(2 * np.pi * np.cumsum(np.linspace(190, 85, len(tt))) / SR) * env(len(tt), 0.002, 0.06))
save('clic_suave', tone(2100, 0.05, decay=0.008, harm=0.1, a=0.001) + 0.15 * lowpass(rng.standard_normal(int(0.05 * SR)), 4000) * env(int(0.05 * SR), 0.001, 0.004))

def metal(sec=0.12, d=0.03):
    tt = t(sec)
    return sum(np.sin(2 * np.pi * f * tt) * w for f, w in [(1250, 1), (2710, 0.6), (4130, 0.35)]) * env(len(tt), 0.001, d)
clack = np.zeros(int(0.25 * SR))
m1 = metal(); m2 = metal(0.15, 0.04)
clack[:len(m1)] += m1 * 0.7
clack[int(0.05 * SR):int(0.05 * SR) + len(m2)] += m2
save('clack_candado', clack)

# C major pentatonic notes for steps and confirmations.
for name, f in [('tono_c', 523.25), ('tono_d', 587.33), ('tono_e', 659.25), ('tono_g', 783.99), ('tono_a', 880.0)]:
    save(name, tone(f, 1.0, decay=0.35))
tt = t(0.7)
save('tono_asc', np.sin(2 * np.pi * np.cumsum(np.linspace(392, 784, len(tt))) / SR) * env(len(tt), 0.08) * np.linspace(1, 0.3, len(tt)))
save('tono_menor', tone(440, 0.8, 0.3) + 0.8 * tone(523.25, 0.8, 0.3))
conf = np.zeros(int(0.8 * SR)); a = tone(523.25, 0.6, 0.25); b = tone(783.99, 0.6, 0.3)
conf[:len(a)] += a; conf[int(0.11 * SR):int(0.11 * SR) + len(b)] += b
save('tono_confirm', conf)

n = int(0.3 * SR)
save('stamp_sordo', np.sin(2 * np.pi * 72 * t(0.3)) * env(n, 0.002, 0.07) + 0.5 * lowpass(rng.standard_normal(n), 600) * env(n, 0.001, 0.03))
save('clunk_madera', (np.sin(2 * np.pi * 210 * t(0.3)) + 0.5 * np.sin(2 * np.pi * 437 * t(0.3))) * env(n, 0.001, 0.05) + 0.3 * lowpass(rng.standard_normal(n), 2500) * env(n, 0.001, 0.01))
tt = t(0.12)
save('gota', np.sin(2 * np.pi * np.cumsum(np.linspace(900, 1600, len(tt))) / SR) * env(len(tt), 0.002, 0.03))
n = int(1.1 * SR)
rise = np.linspace(0, 1, n) ** 2
save('riser_suave', lowpass(rng.standard_normal(n), 300 + 3000 * rise) * rise + 0.4 * np.sin(2 * np.pi * np.cumsum(200 + 200 * rise) / SR) * rise, peak=0.7)
save('tuc_grave', np.sin(2 * np.pi * 115 * t(0.16)) * env(int(0.16 * SR), 0.002, 0.04))
n = int(0.2 * SR)
save('swish', highpass(rng.standard_normal(n), 2500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2, peak=0.6)
save('blip', tone(1320, 0.08, decay=0.02, harm=0.1, a=0.002))
n = int(0.2 * SR)
save('clic_grave', np.sin(2 * np.pi * 120 * t(0.2)) * env(n, 0.001, 0.05) + 0.4 * tone(420, 0.2, 0.01, 0, 0.001))

# Market murmur: band-limited noise + fast random ticks (cut dry at the freeze).
n = int(4.5 * SR)
mur = lowpass(highpass(rng.standard_normal(n), 250), 1400) * 0.6
for k in range(70):
    s = int(rng.random() * (n - 2000))
    c = tone(2500 + 1500 * rng.random(), 0.02, 0.004, 0, 0.001) * 0.5
    mur[s:s + len(c)] += c
save('murmullo', mur, peak=0.7)

# Warm final chord (Cmaj9).
tt = t(5.0)
ch = sum(np.sin(2 * np.pi * f * tt) for f in [261.63, 329.63, 392.0, 493.88, 587.33])
save('acorde_final', ch * np.minimum(1, tt / 0.5) * np.exp(-tt / 2.2))

# Music bed: 96 bpm, soft pentatonic plucks over a pad. C – Am – F – G.
bpm = 96; beat = 60 / bpm; dur = 90.0
N = int(dur * SR); mus = np.zeros(N)
chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]
bar = 4 * beat
pluck_t = t(1.2)
for b in range(int(dur / bar) + 1):
    chord = chords[(b // 2) % 4]
    s0 = int(b * bar * SR)
    pad = sum(np.sin(2 * np.pi * f / 2 * t(bar)) for f in chord) * 0.12
    pad *= np.minimum(1, t(bar) / 0.6) * np.minimum(1, (bar - t(bar)) / 0.6)
    e = min(N, s0 + len(pad)); mus[s0:e] += pad[:e - s0]
    for k in range(8):
        f = chord[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 3 else 1)
        p = (np.sin(2 * np.pi * f * pluck_t) + 0.2 * np.sin(4 * np.pi * f * pluck_t)) * env(len(pluck_t), 0.004, 0.18) * (0.22 if k % 2 == 0 else 0.14)
        s = s0 + int(k * beat / 2 * SR)
        e = min(N, s + len(p)); mus[s:e] += p[:max(0, e - s)]
tm = np.arange(N) / SR
mus *= np.minimum(1, tm / 1.5) * np.clip((dur - tm) / 6.0, 0, 1)
save('music', mus, folder='audio', peak=0.8)
print('ok')
