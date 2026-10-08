#!/usr/bin/env python3
"""Cut a vertical 9:16 ad from one talking-head clip plus car B-roll.

The talking clip is the voiceover for the whole ad (every word kept). The car
clips are muted. Layout:

  [0, hook)          face, big "2 DAYS LEFT"
  [hook, CTA)        car B-roll, cut every 2-3 s, "25% OFF / ENDS SATURDAY"
  [CTA, end]         face again from "tap the button" through the sign-off

Bold word-by-word captions sit in the lower third the whole time.

  python ads/make_ad.py --talk talk.mov --cars a.mov b.mov c.mov d.mov \
      --script script.txt --out ad.mp4

Captions come from (first that applies): --words JSON, faster-whisper (if the
model can be loaded), or --script forced-aligned with pocketsphinx. Every run
writes <out>.words.json and <out>.plan.json next to the MP4; fix a misheard
word in words.json and re-run with --words to re-render.
"""
import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
W, H, FPS = 1080, 1920, 30
CYAN = "&H00DBD95C&"  # site --cy  #5cd9db (ASS is BGR)
INK = "&H00161503&"   # site --cy-ink #031516
WHITE = "&H00FFFFFF&"

HDR_TO_SDR = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
              "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")

# The dictionary has Champaign as "CHamp-ain"; locals say "Sham-pain".
PRONUNCIATIONS = {"champaign": "SH AE M P EY N"}


# ---------------------------------------------------------------- utilities

def sh(cmd, **kw):
    kw.setdefault("check", True)
    return subprocess.run([str(c) for c in cmd], **kw)


def frames(t):
    """Snap a time to the output frame grid."""
    return round(t * FPS) / FPS


def probe(path):
    out = sh(["ffprobe", "-v", "error", "-print_format", "json",
              "-show_streams", "-show_format", path], capture_output=True, text=True).stdout
    j = json.loads(out)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    rot = 0
    for sd in v.get("side_data_list", []):
        if "rotation" in sd:
            rot = int(sd["rotation"])
    if "rotate" in v.get("tags", {}):
        rot = int(v["tags"]["rotate"])
    w, h = int(v["width"]), int(v["height"])
    if abs(rot) % 180 == 90:
        w, h = h, w
    dur = float(v.get("duration") or j["format"]["duration"])
    return {"path": str(path), "dur": dur, "w": w, "h": h,
            "hdr": v.get("color_transfer") in ("arib-std-b67", "smpte2084"),
            "audio": any(s["codec_type"] == "audio" for s in j["streams"])}


def vchain(info, fx=0.5, fy=0.5, zoom=1.0, grade=None, speed=1.0):
    """Filters that turn one source into upright 1080x1920 @ 30 fps."""
    s = max(W / info["w"], H / info["h"]) * zoom
    sw, sh_ = math.ceil(info["w"] * s / 2) * 2, math.ceil(info["h"] * s / 2) * 2
    x, y = round((sw - W) * fx), round((sh_ - H) * fy)
    f = []
    if speed != 1.0:
        f.append(f"setpts=PTS/{speed:.4f}")
    f.append(f"fps={FPS}")
    if info["hdr"]:
        f.append(HDR_TO_SDR)
    f.append(f"scale={sw}:{sh_}:flags=lanczos,crop={W}:{H}:{x}:{y},setsar=1")
    if grade:
        f.append(grade)
    f.append("format=yuv420p")
    return ",".join(f)


# ------------------------------------------------------------- transcription

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_words(n):
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000:
        return [ONES[n // 100], "hundred"] + (num_words(n % 100) if n % 100 else [])
    return num_words(n // 1000) + ["thousand"] + (num_words(n % 1000) if n % 1000 else [])


def spoken(token):
    """How a written script token is said out loud, as dictionary words."""
    t = token.lower().replace("’", "'")
    t = t.replace("&", " and ").replace("%", " percent ").replace("+", " plus ")
    out = []
    for part in re.split(r"[\s\-/]+", t):
        dollars = part.startswith("$")
        part = re.sub(r"[^a-z0-9']", "", part).strip("'")
        if not part:
            continue
        m = re.fullmatch(r"(\d+)(st|nd|rd|th)?", part)
        if m:
            out += num_words(int(m.group(1)))
            if dollars:
                out.append("dollars")
        else:
            out.append(part)
    return out


IPA2ARPA = [  # longest first
    ("tʃ", "CH"), ("dʒ", "JH"), ("eɪ", "EY"), ("aɪ", "AY"), ("ɔɪ", "OY"), ("aʊ", "AW"),
    ("oʊ", "OW"), ("əʊ", "OW"), ("ɜː", "ER"), ("iː", "IY"), ("uː", "UW"), ("ɑː", "AA"),
    ("ɔː", "AO"), ("p", "P"), ("b", "B"), ("t", "T"), ("d", "D"), ("k", "K"), ("ɡ", "G"),
    ("g", "G"), ("f", "F"), ("v", "V"), ("θ", "TH"), ("ð", "DH"), ("s", "S"), ("z", "Z"),
    ("ʃ", "SH"), ("ʒ", "ZH"), ("h", "HH"), ("m", "M"), ("n", "N"), ("ŋ", "NG"), ("l", "L"),
    ("ɹ", "R"), ("r", "R"), ("w", "W"), ("j", "Y"), ("ɾ", "T"), ("i", "IY"), ("ɪ", "IH"),
    ("ᵻ", "IH"), ("e", "EH"), ("ɛ", "EH"), ("æ", "AE"), ("a", "AA"), ("ɑ", "AA"),
    ("ɒ", "AA"), ("ɔ", "AO"), ("o", "OW"), ("ʊ", "UH"), ("u", "UW"), ("ʌ", "AH"),
    ("ə", "AH"), ("ɐ", "AH"), ("ɚ", "ER"), ("ɝ", "ER"), ("ɜ", "ER"), ("x", "K"),
]


def guess_phones(word):
    """Pronunciation for a word missing from the dictionary, via espeak-ng."""
    if not shutil.which("espeak-ng"):
        return None
    ipa = sh(["espeak-ng", "-q", "--ipa", "-v", "en-us", word],
             capture_output=True, text=True).stdout.strip()
    ipa = re.sub(r"[ˈˌː\s‿ʔ.]", lambda m: "ː" if m.group() == "ː" else "", ipa)
    phones, i = [], 0
    while i < len(ipa):
        for k, v in IPA2ARPA:
            if ipa.startswith(k, i):
                phones.append(v)
                i += len(k)
                break
        else:
            i += 1
    return " ".join(phones) or None


def align_script(wav, text):
    """Force-align a known script to the audio. Returns display words with times."""
    from pocketsphinx import Decoder
    tokens = text.split()
    said, owner = [], []
    for i, tok in enumerate(tokens):
        for w in spoken(tok):
            # Dictionary words can't be redefined, so overrides get their own entry.
            said.append(w + "_" if w in PRONUNCIATIONS else w)
            owner.append(i)
    # Default beams prune the whole alignment away on a 30-40 s take; open them up.
    d = Decoder(samprate=16000, loglevel="FATAL", beam=1e-80, wbeam=1e-60, pbeam=1e-80)
    for w in sorted(set(said)):
        if w.endswith("_"):
            d.add_word(w, PRONUNCIATIONS[w[:-1]], True)
        elif d.lookup_word(w) is None:
            ph = guess_phones(w)
            if not ph:
                sys.exit(f"Can't pronounce '{w}' for alignment; install espeak-ng or spell it out.")
            d.add_word(w, ph, True)
    d.set_align_text(" ".join(said))
    with wave.open(str(wav), "rb") as wf:
        audio = wf.readframes(wf.getnframes())
    d.start_utt()
    d.process_raw(audio, full_utt=True)
    d.end_utt()
    segs = [s for s in (d.seg() or []) if not s.word.startswith(("<", "[", "("))]
    if len(segs) != len(said):
        sys.exit(f"Alignment matched {len(segs)}/{len(said)} words. Check the script matches the audio.")
    out = []
    for i, tok in enumerate(tokens):
        mine = [s for s, o in zip(segs, owner) if o == i]
        if mine:
            out.append({"w": tok, "s": mine[0].start_frame / 100, "e": (mine[-1].end_frame + 1) / 100})
    return out


def transcribe(wav, model):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(str(wav), language="en", word_timestamps=True,
                           initial_prompt="The Gloss Spot, car detailing in Champaign, IL.")
    return [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]


def get_words(args, talk, tmp):
    if args.words:
        return json.loads(Path(args.words).read_text())
    wav = tmp / "talk16k.wav"
    sh(["ffmpeg", "-v", "error", "-y", "-i", talk["path"], "-vn", "-ac", "1", "-ar", "16000",
        "-c:a", "pcm_s16le", wav])
    if not args.script:
        try:
            return transcribe(wav, args.whisper)
        except Exception as e:  # model download blocked, package missing, ...
            sys.exit(f"Whisper unavailable ({e.__class__.__name__}); pass --script with the exact words.")
    return align_script(wav, Path(args.script).read_text())


# ------------------------------------------------------------------ planning

def norm(w):
    return re.sub(r"[^a-z0-9%$']", "", w.lower())


def find_phrase(words, phrase):
    target = [norm(p) for p in phrase.split()]
    for i in range(len(words) - len(target) + 1):
        if [norm(w["w"]) for w in words[i:i + len(target)]] == target:
            return i
    return None


def snap(words, t, lo, hi):
    """Move a cut to the closest gap between words inside [lo, hi]."""
    best = None
    for a, b in zip(words, words[1:]):
        mid = (a["e"] + b["s"]) / 2
        if lo <= mid <= hi and (best is None or abs(mid - t) < abs(best - t)):
            best = mid
    return best if best is not None else t


def plan_shots(words, start, end, hook, cta_phrase, n_cars, moments, cars):
    i = find_phrase(words, cta_phrase)
    if i is None:
        sys.exit(f'Couldn\'t find "{cta_phrase}" in the transcript; pass --cta with the exact words.')
    tap = words[i]
    prev_end = words[i - 1]["e"] if i else start
    cta = frames(max(prev_end, tap["s"] - 0.2) if tap["s"] - prev_end > 0.05 else tap["s"] - 0.1)
    hook_end = frames(snap(words, start + hook, start + hook - 0.4, start + hook + 0.6))
    span = cta - hook_end
    if span < 2 * n_cars:
        sys.exit(f"Only {span:.1f}s between the hook and the CTA: not enough to show all {n_cars} cars.")
    n = max(n_cars, round(span / 2.5))
    while span / n > 3.0:
        n += 1
    while n > n_cars and span / n < 2.0:
        n -= 1
    cuts = [hook_end]
    for k in range(1, n):
        ideal = hook_end + span * k / n
        c = frames(snap(words, ideal, ideal - 0.3, ideal + 0.3))
        if not (1.8 <= c - cuts[-1] <= 3.2):
            c = frames(ideal)
        cuts.append(c)
    cuts.append(cta)

    shots = [{"src": "talk", "t0": start, "t1": hook_end, "in": start}]
    used = [0] * n_cars
    for k in range(n):
        car = k % n_cars
        dur = cuts[k + 1] - cuts[k]
        mo = moments[car][used[car] % len(moments[car])]
        used[car] += 1
        clip = cars[car]["dur"]
        speed = 1.0
        if clip < dur + 0.05:  # clip shorter than the shot: slow it a touch
            speed, t_in = max(clip / (dur + 0.05), 0.75), 0.0
        else:
            t_in = min(max(mo["in"], 0.0), clip - dur - 0.05)
        shots.append({"src": car, "t0": cuts[k], "t1": cuts[k + 1], "in": round(t_in, 3),
                      "fx": mo.get("fx", 0.5), "speed": speed})
    shots.append({"src": "talk", "t0": cta, "t1": end, "in": cta})
    return shots, hook_end, cta


def auto_moments(info, want=3, win=2.6):
    """Pick the sharpest, steadiest windows of a clip (slow pans, not shaky bits)."""
    import numpy as np
    rate, w = 6, 160
    h = int(round(w * info["h"] / info["w"] / 2) * 2)
    raw = sh(["ffmpeg", "-v", "error", "-i", info["path"], "-vf",
              f"fps={rate},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
             capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    if len(fr) < 4:
        return [{"in": 0.0}]
    lap = fr[:, 1:-1, 1:-1] * 4 - fr[:, :-2, 1:-1] - fr[:, 2:, 1:-1] - fr[:, 1:-1, :-2] - fr[:, 1:-1, 2:]
    sharp = lap.reshape(len(fr), -1).var(axis=1)
    motion = np.r_[0, np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))]
    sharp_z = (sharp - sharp.mean()) / (sharp.std() + 1e-6)
    n = int(win * rate)
    cands = []
    for i in range(int(0.3 * rate), max(len(fr) - n - int(0.3 * rate), 1)):
        shake = motion[i + 1:i + n].std() / (motion.mean() + 1e-6)
        cands.append((sharp_z[i:i + n].mean() - 1.5 * shake, i / rate))
    picks = []
    for _, t in sorted(cands, reverse=True):
        if all(abs(t - p) >= win for p in picks):
            picks.append(t)
        if len(picks) == want:
            break
    return [{"in": round(t, 2)} for t in sorted(picks)] or [{"in": 0.0}]


# ------------------------------------------------------------------ captions

def ts(t):
    t = max(t, 0)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def caption_text(w):
    w = w.upper().strip()
    return re.sub(r"[.,;:\"“”]+$", "", re.sub(r"^[\"“”]+", "", w))


def chunk(words, max_words=3, max_chars=15):
    groups, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        text = " ".join(caption_text(x["w"]) for x in cur)
        if (nxt is None or len(cur) >= max_words or re.search(r"[.,!?;:]$", w["w"])
                or nxt["s"] - w["e"] > 0.35
                or len(text) + 1 + len(caption_text(nxt["w"])) > max_chars):
            groups.append(cur)
            cur = []
    return groups


def build_ass(words, start, end, hook_end, cta, cap_y, promo_y):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Black,108,{WHITE},{WHITE},&H00000000&,&H99000000&,0,0,0,0,100,100,0,0,1,8,5,5,60,60,0,1
Style: Big,Bebas Neue,300,{WHITE},{WHITE},&H00000000&,&H99000000&,0,0,0,0,100,100,4,0,1,9,8,5,40,40,0,1
Style: Tag,Bebas Neue,150,{INK},{INK},{CYAN},&H99000000&,0,0,0,0,100,100,6,0,3,24,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    pop = r"\fscx135\fscy135\alpha&HFF&\t(0,160,\fscx100\fscy100\alpha&H00&)"

    # "2 DAYS LEFT" over the hook.
    ev.append(f"Dialogue: 2,{ts(0)},{ts(hook_end - start)},Tag,,0,0,0,,"
              f"{{\\an5\\pos(540,{promo_y})\\fs280{pop}}}2 DAYS LEFT")
    # "25% OFF / ENDS SATURDAY" over the car footage.
    a, b = hook_end - start + 0.05, cta - start
    ev.append(f"Dialogue: 2,{ts(a)},{ts(b)},Big,,0,0,0,,"
              f"{{\\an5\\pos(540,{promo_y - 30}){pop}}}25% OFF")
    ev.append(f"Dialogue: 2,{ts(a + 0.12)},{ts(b)},Tag,,0,0,0,,"
              f"{{\\an5\\pos(540,{promo_y + 165})\\fs120{pop}}}ENDS SATURDAY")

    # Word-by-word captions, current word in brand cyan.
    groups = chunk(words)
    for gi, g in enumerate(groups):
        g_end = g[-1]["e"]
        if gi + 1 < len(groups) and groups[gi + 1][0]["s"] - g_end < 0.4:
            g_end = groups[gi + 1][0]["s"]
        g_end = min(max(g_end, g[0]["s"] + 0.3), end)
        texts = [caption_text(w["w"]) for w in g]
        for j, w in enumerate(g):
            s = g[0]["s"] if j == 0 else w["s"]
            e = g_end if j == len(g) - 1 else g[j + 1]["s"]
            if e <= s:
                continue
            line = " ".join((f"{{\\c{CYAN}}}{t}{{\\c{WHITE}}}" if k == j else t)
                            for k, t in enumerate(texts))
            anim = r"\fscx112\fscy112\t(0,90,\fscx100\fscy100)" if j == 0 else ""
            ev.append(f"Dialogue: 1,{ts(s - start)},{ts(e - start)},Cap,,0,0,0,,"
                      f"{{\\an5\\pos(540,{cap_y}){anim}}}{line}")
    return head + "\n".join(ev) + "\n"


# -------------------------------------------------------------------- render

def loudnorm_stats(talk, start, dur, pre):
    r = sh(["ffmpeg", "-hide_banner", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", talk["path"],
            "-vn", "-af", f"{pre},loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"],
           capture_output=True, text=True)
    return json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])


def render(args, talk, cars, shots, words, start, end, hook_end, cta, out):
    tmp = Path(tempfile.mkdtemp(prefix="ad-"))
    shutil.copytree(FONTS, tmp / "fonts")
    (tmp / "captions.ass").write_text(build_ass(words, start, end, hook_end, cta,
                                                args.caption_y, args.promo_y))
    total = end - start
    cmd = ["ffmpeg", "-hide_banner", "-v", "error", "-y"]
    fg = []
    for k, s in enumerate(shots):
        dur = s["t1"] - s["t0"]
        info = talk if s["src"] == "talk" else cars[s["src"]]
        speed = s.get("speed", 1.0)
        cmd += ["-ss", f"{s['in']:.3f}", "-t", f"{dur / speed + 0.5:.3f}", "-i", info["path"]]
        grade = None if s["src"] == "talk" else "eq=contrast=1.04:saturation=1.10"
        fg.append(f"[{k}:v]{vchain(info, fx=s.get('fx', 0.5), grade=grade, speed=speed)},"
                  f"tpad=stop_mode=clone:stop_duration=1,trim=duration={dur:.4f},"
                  f"setpts=PTS-STARTPTS[v{k}]")
    fg.append("".join(f"[v{k}]" for k in range(len(shots)))
              + f"concat=n={len(shots)}:v=1:a=0,ass=captions.ass:fontsdir=fonts[vout]")

    ai = len(shots)
    cmd += ["-ss", f"{start:.3f}", "-t", f"{total:.3f}", "-i", talk["path"]]
    pre = "highpass=f=80,acompressor=threshold=-21dB:ratio=3:attack=8:release=150:makeup=2"
    m = loudnorm_stats(talk, start, total, pre)
    fg.append(f"[{ai}:a]{pre},loudnorm=I=-14:TP=-2:LRA=11:measured_I={m['input_i']}:"
              f"measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
              f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
              f"aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration={total:.4f},"
              f"afade=t=in:d=0.03,afade=t=out:st={total - 0.3:.3f}:d=0.3[aout]")

    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-profile:v", "high",
            "-level", "4.1", "-pix_fmt", "yuv420p", "-r", str(FPS), "-g", str(FPS * 2),
            "-maxrate", "14M", "-bufsize", "28M",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-t", f"{total:.4f}", "-movflags", "+faststart", Path(out).resolve()]
    sh(cmd, cwd=tmp)
    shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--talk", required=True, help="talking-head clip (the voiceover)")
    ap.add_argument("--cars", nargs="+", required=True, help="car B-roll clips (audio is muted)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--script", help="exact spoken words, for forced alignment")
    ap.add_argument("--words", help="word timings JSON from a previous run")
    ap.add_argument("--moments", help='JSON: per car, a list of {"in": sec, "fx": 0-1} best moments')
    ap.add_argument("--whisper", default="small.en", help="faster-whisper model name or path")
    ap.add_argument("--cta", default="tap the button", help="phrase where we cut back to the face")
    ap.add_argument("--hook", type=float, default=3.0, help="seconds on the face before B-roll")
    ap.add_argument("--caption-y", type=int, default=1330, help="caption centre (lower third)")
    ap.add_argument("--promo-y", type=int, default=420, help="centre of the promo text")
    ap.add_argument("--no-trim", action="store_true", help="keep dead air before/after the words")
    ap.add_argument("--plan-only", action="store_true", help="write words/plan JSON, skip the render")
    args = ap.parse_args()

    talk = probe(args.talk)
    if not talk["audio"]:
        sys.exit("The talking clip has no audio track.")
    cars = [probe(c) for c in args.cars]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="ad-words-"))
    words = get_words(args, talk, tmp)
    shutil.rmtree(tmp, ignore_errors=True)
    Path(f"{out}.words.json").write_text(json.dumps(words, indent=1))

    start, end = 0.0, talk["dur"]
    if not args.no_trim:
        start = frames(max(0.0, words[0]["s"] - 0.15))
        end = min(talk["dur"], words[-1]["e"] + 0.8)
    end = start + math.floor((end - start) * FPS) / FPS

    if args.moments:
        moments = json.loads(Path(args.moments).read_text())
    else:
        moments = [auto_moments(c) for c in cars]
    shots, hook_end, cta = plan_shots(words, start, end, args.hook, args.cta,
                                      len(cars), moments, cars)
    plan = {"start": start, "end": end, "length": round(end - start, 2), "hook_end": hook_end,
            "cta": cta, "shots": [{**s, "src": s["src"] if s["src"] == "talk" else Path(args.cars[s["src"]]).name}
                                  for s in shots]}
    Path(f"{out}.plan.json").write_text(json.dumps(plan, indent=1))
    print(f"Length {end - start:.2f}s | face 0-{hook_end - start:.2f}s | "
          f"{len(shots) - 2} car shots | face from {cta - start:.2f}s")
    if not 33 <= end - start <= 42:
        print(f"Note: {end - start:.1f}s is outside the 35-40s target (every word is kept).")
    if not args.plan_only:
        render(args, talk, cars, shots, words, start, end, hook_end, cta, out)
        print(f"Wrote {out}")


if __name__ == "__main__":
    main()
