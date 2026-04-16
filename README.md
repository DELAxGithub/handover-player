# Handover

**Video review for teams that already use Dropbox.**

Paste a Dropbox link, get a shareable review page with frame-accurate comments — no re-uploads, no new accounts, no per-seat fees.

![Handover UI](https://placehold.co/1200x675/111/fff?text=Handover+UI)

## Why Handover?

Most video review tools make you re-upload files to their own storage and charge per reviewer. Handover plays your Dropbox videos directly and lets anyone comment with just a link.

| Pain point | How Handover solves it |
|---|---|
| **Re-uploading large files** | Plays directly from Dropbox — no upload, no wait |
| **Per-seat pricing** | Share a link. Reviewers don't need accounts |
| **Losing context in email threads** | Comments are locked to timecode on a visual timeline |
| **Getting feedback into your NLE** | Export to Premiere Pro XML or DaVinci Resolve CSV |

## Features

### Dropbox Direct Playback
Paste a Dropbox share link and start reviewing instantly. Supports 4K and long-form content without proxy generation.

### Frame-Accurate Comments
Every comment is locked to a timecode. Click a comment to jump to that exact frame. Timeline markers show where feedback lives at a glance.

### Real-Time Collaboration
Multiple reviewers see comments appear in real time. No refresh needed.

### NLE-Style Keyboard Shortcuts

| Key | Action |
|:---|:---|
| **Space** / **K** | Play / Pause |
| **J** | Rewind 10s |
| **L** | Forward 10s |
| **←** / **→** | Skip 5s |
| **1-4** | Playback speed |
| **M** | Toggle mute |
| **F** | Fullscreen |
| **C** | Focus comment input |

### Pro Export
Export comments as **Premiere Pro XML** (sequence markers) or **DaVinci Resolve CSV** (timeline markers). Supports 23.976fps, 29.97fps drop-frame, and more.

### Folders & Episodes
Organize multi-episode projects into folders. Share an entire folder or individual episodes.

## Quick Start

1. **Paste a link** — Drop a Dropbox video URL into the input field
2. **Review** — Play the video, leave timestamped comments
3. **Share** — Copy the review link and send it to your team. No sign-up required

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Postgres + Realtime) |
| Deploy | Vercel |

## Development

```bash
git clone https://github.com/DELAxGithub/handover-player.git
cd handover-player
npm install
cp .env.example .env.local   # Add your Supabase keys
npm run dev                   # http://localhost:5173
```

## License

MIT

---
Built by [DELAX Studio](https://github.com/DELAxGithub)
