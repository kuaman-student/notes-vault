# 🚀 NexusNotes v2.0 — Futuristic Cloud Knowledge Base & Vault

> An ultra-modern, cyberpunk & glassmorphic personal documentation & study portal built for computer science students and engineers. Real-time Firebase Firestore synchronization across laptop and mobile, Master PIN security for public GitHub deployment, and nested branch hierarchy!

---

## ✨ What's New in v2.0

- ☁️ **Real-Time Firebase Firestore Sync**: Auto-syncs notes, branches, and categories between your laptop and phone in real-time.
- 🔒 **Master Vault Passcode Protection (Default PIN: `2026`)**:
  - Safe for public GitHub & GitHub Pages deployment!
  - Web visitors are restricted to **Read-Only mode**.
  - Creating, editing, or deleting notes and folders requires your Master PIN.
  - Master PIN can be changed anytime from the Cloud/Security settings modal.
- 🌿 **Hierarchical Branch Tree Navigation**: Organize your notes subject-wise with unlimited nested folders and subfolders (B.Tech branches, topics, subtopics).
- 🎨 **Multi-Theme Engine**: Neon Cyberpunk, Matrix Green, Dark OLED, and Clean Light themes with instant 1-click switcher.
- ⚡ **Zero-Latency Offline-First (IndexedDB)**: Works completely offline and syncs automatically the moment you reconnect.
- 📂 **Drag & Drop Markdown / JSON Uploader**: Drop any `.md` or `.json` file to auto-import notes with tags, categories, and reading time.
- 📐 **LaTeX Math Support**: Seamless mathematical equation rendering powered by KaTeX ($E=mc^2$, attention weights, recurrence relations).
- 🧠 **Neural Quiz Arena & Multi-Note Exam Simulator**:
  - **Multi-File Selection**: Choose 1 note, multiple selected notes, or entire folders to generate comprehensive quizzes.
  - **Configurable Questions**: Select 3, 5, 10, 15, 20 questions with Mixed, Easy, or Medium difficulty.
  - **Dual Mode**: *Instant Practice Mode* (immediate feedback & explanations) and *Exam / Placement Simulation Mode* (timed recall test).
  - **Quiz Vault & Database Storage**: Every quiz attempt, score, percentage, and detailed answers are automatically saved to Firebase Firestore & IndexedDB!
  - **Review & Delete Records**: Review previous test questions, retake any quiz, or delete past attempts (protected by Master PIN).
- 🛠️ **Fixed Sidebar Scroll Overlap**: Resolved layout z-index and container scrolling so the sidebar never covers the top navbar.
- 🎨 **Multi-Theme Engine**: Neon Cyberpunk, Matrix Green, Dark OLED, and Clean Light themes with instant 1-click switcher.
- ⚡ **Zero-Latency Offline-First (IndexedDB)**: Works completely offline and syncs automatically the moment you reconnect.
- 📂 **Drag & Drop Markdown / JSON Uploader**: Drop any `.md` or `.json` file to auto-import notes with tags, categories, and reading time.
- 📐 **LaTeX Math Support**: Seamless mathematical equation rendering powered by KaTeX ($E=mc^2$, attention weights, recurrence relations).
- 💻 **Syntax-Highlighted Code Cards**: One-click code copy with language badges.
- 🎯 **Interview & Placement Prep Tools**:
  - **Flashcards Mode**: Interactive flip-cards for active recall.
  - **Revision Tracker**: Track notes as *Need Revision* ⚠️, *In Progress* 🔄, or *Mastered* ✅ (with confetti 🎉).
- 🧠 **Cosmic Knowledge Graph**: Visual graph network connecting all notes by tags and categories.
- ⏱️ **Neural Pomodoro Timer & Quick Scratchpad**: Built-in focus tools to study with zero context switching.
- 🔊 **Text-to-Speech (TTS)**: Listen to your notes on-the-go while commuting.

---

## 🔐 Security & GitHub Deployment

When you post this project publicly on GitHub:
1. **`.env` is automatically git-ignored** to prevent exposing private environment files.
2. In-app **Master PIN guard** (`default: 2026`) stops random visitors from modifying or deleting your notes or quiz records.
3. Firestore Security Rules are included in `firestore.rules` for easy deployment in your Firebase Console.

### Default Master Passcode:
```
2026
```
*(You can change this anytime inside the site by clicking the Cloud Synced pill $\rightarrow$ Master PIN tab).*

---

## 🚀 How to Run Locally

1. Open a terminal in this directory:
   ```bash
   npm run dev
   ```
2. Open the URL shown in your browser (e.g. `http://localhost:5173`).
3. To view on your phone on the same Wi-Fi, open the Network URL displayed in the terminal!

---

## 🌐 Step-by-Step: How to Host on GitHub Pages (FREE)

### Method 1: Automatic via GitHub Actions (Recommended - Zero Setup!)
An automated workflow `.github/workflows/deploy.yml` is already included in this repository.

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: NexusNotes with Neural Quiz Arena and Cloud Sync"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages in Repo Settings**:
   - Go to your repository on GitHub.
   - Click **Settings** $\rightarrow$ **Pages** (on the left menu).
   - Under **Build and deployment $\rightarrow$ Source**, select **"GitHub Actions"**.
   - That's it! GitHub will automatically build and deploy your site in ~1 minute at `https://<your-username>.github.io/<repo-name>/`!

### Method 2: Manual 1-Command Deploy via `gh-pages`
If you prefer building locally and pushing to a `gh-pages` branch:
1. Run:
   ```bash
   npm run deploy
   ```
2. In GitHub repository **Settings $\rightarrow$ Pages**, ensure the source is set to **Deploy from a branch** and select `gh-pages` $\rightarrow$ `/ (root)`.

---

## ⌨️ Helpful Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Spotlight Search Palette |
| `Ctrl + S` / `Cmd + S` | Save current note in Editor |
| `Esc` | Close any open modal |

---

Built for excellence, readability, and placement success! 🎓
