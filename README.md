# 🛋️ Couch Co-Op Lite

A lightweight, zero-server entertainment hub and AI matchmaker for couples, roommates, and friends. Track **Movies, TV Series, Video Games, and Books** with live **Shared vs. Solo** taste profiling.

Built with **React 18 + Vite**, **Google Gemini Free API**, **TMDB**, **RAWG**, and **Open Library**. Hosted **100% free on GitHub Pages** with **Google Sheets sync**.

[![Deploy to GitHub Pages](https://github.com/caitlyn-r/couch-co-op-lite/actions/workflows/deploy.yml/badge.svg)](https://github.com/caitlyn-r/couch-co-op-lite/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-purple)](https://aistudio.google.com/)
[![Database: Google Sheets](https://img.shields.io/badge/Database-Google%20Sheets-emerald)](https://sheets.google.com)

---

## ✨ Features

- 🛋️ **Shared vs. Solo Tracking**: Differentiate between media you enjoy **Together (Co-Op)** versus personal **Solo** guilty pleasures (e.g. *Bridgerton*, *Twilight*, *Elden Ring*).
- 🚦 **Interest Meter & Veto**: Mark interest before watching/playing (`🔥 Hyped`, `👍 Down`, `🤷 Neutral`, `🚫 Hard Pass`). Passing automatically shifts shared items into the other partner's Solo queue!
- 🎬 **Multi-Media Add-ons**: Toggle support in Settings for:
  - 🍿 **Movies & TV Shows** (via TMDB)
  - 🎮 **Video Games** (Co-Op & Solo, via RAWG)
  - 📚 **Books & Audiobooks** (Shared reading & book clubs, via Open Library)
- ⭐ **Duo Rating System**: 1–10 ratings for Partner 1 & Partner 2 with automatic combined average scores.
- ✨ **Tri-Mode Gemini AI Matchmaker**:
  1. 🤝 **The Compromise**: Discovers clever middle-ground titles that bridge your divergent tastes.
  2. 👤 **Just for {Partner 1}**: AI picks tailored strictly to Partner 1's solo likes.
  3. 👤 **Just for {Partner 2}**: AI picks tailored strictly to Partner 2's solo likes.
- 🎲 **Multi-Format Vibe Roulette**: Spin for **Movie Night**, **Game Night**, or your **Next Book Read** with confetti celebrations!
- 📊 **Google Sheets Sync**: Real-time collaborative database using a lightweight 1-file Google Apps Script webhook.
- 🔒 **Zero Server Secrets**: All API keys stay in your browser's `localStorage` — completely safe for public GitHub forks.

---

## 🚀 60-Second Quickstart

### 1. Run Locally

```bash
cd couch-co-op-lite
npm install
npm run dev
# → http://localhost:3000
```

### 2. Deploy 100% Free on GitHub Pages

1. **Fork** this repository.
2. Go to your fork's **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Push any commit to `main` (or run manually in the **Actions** tab).
5. Your instance is live at `https://<your-username>.github.io/couch-co-op-lite/`!

---

## 🔑 Free API Keys

| Service | Category | API Key Required? | Where to get it |
| :--- | :--- | :---: | :--- |
| **Google Gemini Free API** | AI Matchmaker & Roulette | Free Key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **TMDB API** | Movies & TV Series | Free Key | [The Movie Database](https://www.themoviedb.org/settings/api) |
| **Open Library API** | Books & Audiobooks | **NO KEY NEEDED!** | 100% Free Open Source |
| **RAWG API** | Video Games | Optional Free Key | [RAWG.io](https://rawg.io/apidocs) |
| **Google Sheets Sync** | Shared Database | Script URL | See [`google-apps-script/README.md`](./google-apps-script/README.md) |

---

## 📄 License

MIT © [Caitlyn](https://github.com/caitlyn-r)
