# Oxium Browser

**Download:** [OxiumBrowserInstaller.exe](https://github.com/ProjectOxium/Browser/releases/download/v1.0.0/OxiumBrowserInstaller.exe)

---

A privacy-focused desktop web browser built on Electron + React with built-in ad blocking, fingerprinting protection, and a custom dark-themed UI.

## Features

### Privacy & Security
- **Built-in Ad Blocking** — Ghostery's adblocker engine with EasyList + EasyPrivacy filters
- **Three Privacy Tiers** — Strict (blocks all trackers), Balanced (blocks known trackers), Relaxed (blocks only malicious)
- **Auto HTTPS Upgrades** — Redirects HTTP to HTTPS automatically
- **Per-Tab Tracker Dashboard** — Real-time count of trackers/ads blocked on each page

### Browsing
- **Tab Management** — Add, close, reorder, and keyboard-switch tabs
- **Unified URL/Search Bar** — Omnibox-style input with DuckDuckGo, Google, Brave, and Bing search engines
- **New Tab Page** — Live clock, personalized greeting, favorites grid, and most-visited sites
- **History** — Full browsing history with search and quick navigation
- **Download Manager** — Real-time progress tracking for all downloads
- **Find in Page** — Built-in Ctrl+F find bar

### Bookmarks
- **Quick Bookmarking** — Ctrl+D or right-click to save
- **Bookmark Bar** — Persistent bar for one-click access
- **Favorites Grid** — Up to 16 favorites pinned to your new tab page

### Profiles
- **Multiple Profiles** — Isolated bookmarks, history, settings, and extensions per profile
- **Profile Switcher** — Quick-switch from the title bar with colored avatars

### Password Manager
- **Encrypted Vault** — AES-256-GCM encryption with master password (PBKDF2, 600K iterations)
- **Import/Export** — CSV migration to and from other password managers
- **Auto-Unlock** — OS-level key store persistence between sessions

### Extensions
- **Chrome Web Store Support** — Install extensions by URL or extension ID
- **Suggested Store** — Curated picks: uBlock Origin, Bitwarden, Vimium, HTTPS Everywhere, and more
- **Developer Mode** — Load unpacked extensions from local folders
- **Per-Extension Toggle** — Enable/disable individual extensions with toolbar integration

### UI
- **Frameless Dark Theme** — Custom title bar with minimize, maximize, and close controls
- **Keyboard Shortcuts** — Full set for power users (Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+H, Ctrl+J, Ctrl+D, etc.)
- **Custom Scrollbars** — Dark-themed native scrollbar styling
- **Context Menus** — Right-click actions for links, text selection, and page navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Electron 31 (Chromium) |
| Frontend | React 18 + TypeScript 5 |
| Build | Vite 5 |
| State | Zustand 4 |
| Styling | Tailwind CSS 3 |
| Ad Blocking | @ghostery/adblocker-electron |

## Requirements

- Windows 10 or later (64-bit)
- Administrator privileges (for installation only)

> v0.1.0 · Project Oxium · 2026
