# Ads

`make_ad.py` cuts a vertical 9:16 Reels/Facebook ad from a talking-head clip
plus car B-roll: face for the hook, cars every 2–3 s while the voice keeps
going, face again from "tap the button" through the sign-off. Every spoken
word is kept, car audio is muted, bold word-by-word captions sit in the lower
third, and the promo text ("2 DAYS LEFT", "25% OFF / ENDS SATURDAY") uses the
site's Bebas Neue + cyan.

```sh
python3 -m venv .venv && .venv/bin/pip install -r ads/requirements.txt
.venv/bin/python ads/make_ad.py --talk talk.mov --cars a.mov b.mov c.mov d.mov \
    --script script.txt --out ad.mp4
```

- `--script` is the exact words said; they're force-aligned to the audio for
  caption timing. Without it the clip is transcribed with faster-whisper.
- Each run writes `ad.mp4.words.json` (caption words + times) and
  `ad.mp4.plan.json` (every shot). Fix a word in the JSON and re-run with
  `--words ad.mp4.words.json`.
- `--moments moments.json` picks the car moments by hand:
  `[[{"in": 4.2, "fx": 0.4}, ...], ...]` one list per car, `in` = start second,
  `fx` = horizontal crop position (0 left, 1 right). Otherwise the sharpest,
  steadiest stretches are picked automatically.
- `--plan-only` writes the JSON without rendering. `--hook`, `--cta`,
  `--caption-y`, `--promo-y` adjust timing and placement.

Output: H.264 High / AAC 48 kHz, 1080×1920, 30 fps, −14 LUFS, faststart.
iPhone HDR footage is tone-mapped to SDR so it doesn't post washed out.
