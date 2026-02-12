---
name: openai-whisper
description: Local speech-to-text with the Whisper CLI (no API key).
homepage: https://openai.com/research/whisper
metadata:
  {
    "starforgeos":
      {
        "emoji": "🎙️",
        "requires": { "bins": ["whisper", "yt-dlp"] },
        "install":
          [
            {
              "id": "brew-whisper",
              "kind": "brew",
              "formula": "openai-whisper",
              "bins": ["whisper"],
              "label": "Install OpenAI Whisper (brew)",
            },
            {
              "id": "brew-ytdlp",
              "kind": "brew",
              "formula": "yt-dlp",
              "bins": ["yt-dlp"],
              "label": "Install yt-dlp for URL audio downloads (brew)",
            },
          ],
      },
  }
---

# Whisper (CLI)

Use `whisper` to transcribe audio locally.

Quick start

- `whisper /path/audio.mp3 --model tiny --output_format txt --output_dir .`
- `whisper /path/audio.m4a --model tiny --task translate --output_format srt`

URL input (YouTube, podcast pages, direct media links)

1. Download best audio with yt-dlp (and print final file path):
   - `AUDIO_PATH=$(yt-dlp -x --audio-format mp3 -o "/tmp/whisper-%(id)s.%(ext)s" --print after_move:filepath "<URL>")`
2. Transcribe with Whisper tiny:
   - `whisper "$AUDIO_PATH" --model tiny --output_format txt --output_dir /tmp`

Notes

- Models download to `~/.cache/whisper` on first run.
- For Discord voice notes and fast turnarounds, explicitly use `--model tiny`.
- `--model` defaults to `turbo` on this install, so always set model explicitly.
- Use smaller models for speed, larger models for accuracy when needed.
