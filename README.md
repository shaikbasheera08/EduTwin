# EduTwin — AI-Powered Digital Student Twin

> **Understand yourself. Improve your skills. Build your future.**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Build-Passing-emerald.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20SPA-blue.svg)]()

---

## 1. Project Overview & Problem Statement

### The Problem
Engineering students face a disconnect between traditional academic coursework and real-world industry hiring benchmarks:
- **Blind Progression:** Students know their grades (CGPA) but lack clarity on whether their technical skill set matches what product teams actually look for.
- **Generic Roadmaps:** Generic tutorials provide linear paths without accounting for a student's existing strengths or specific deficits.
- **Uncertainty in Effort Allocation:** Students do not know which skill will yield the highest increase in career readiness before investing weeks of study.

### The Proposed Solution: EduTwin
**EduTwin** creates a dynamic computational representation — a **Digital Student Twin** — that mirrors the student's evolving academic scores, technical ratings, completed coursework, and career aspirations.

EduTwin does not merely tell students what they are currently good at. It shows them where they are going, identifies exact mathematical skill gaps against calibrated industry benchmarks, and features an interactive **What-If Simulation** allowing students to forecast how improving specific skills will directly elevate their career readiness.

---

## 2. Key Features & Functionality

| Feature | Description |
|---|---|
| **Digital Student Twin** | Central interactive SVG neural silhouette with glowing skill nodes, 6-axis competency radar, and Academic Health vs. Career Readiness comparison. |
| **Smart Skill Gap Analysis** | Real-time mathematical gap calculations: `Skill Gap = max(0, Required − Current)` across 7 technical tracks (Full Stack, AI, Data Science, Cyber, Cloud, Software Dev, Data Analyst). |
| **What-If Simulation (Signature WOW Feature)** | Side-by-side comparison of Current Twin vs. Simulated Future Twin. Adjust skill sliders to forecast career readiness score jumps (e.g., +24 percentage points). |
| **Personalized 30-Day Roadmap** | 4-week structured curriculum tailored to verified deficits with interactive milestone checkboxes and real-time state persistence. |
| **AI Career Guidance** | Algorithmic career match scoring, alternative career suggestions, and curated portfolio project ideas to bridge gaps. |
| **Instant Demo Mode** | Zero-barrier hackathon evaluation pre-loaded with **Rahul Kumar** (CSE 3rd Year, 8.2 CGPA) with full functional data. |
| **5-Step Guided Onboarding** | Interactive wizard covering personal info, academic grades, 0–100 skill ratings, specialization interests, and target roles with animated twin synthesis. |
| **Progress Tracking & History** | Verifiable log of past score updates, completed tasks, and learning hours logged with timestamped verification records. |
| **Theme & Responsive UX** | Light ☀️ and Dark 🌙 mode toggle, responsive layout supporting desktop, tablet, and mobile screen sizes. |

---

## 3. Real-World Applications & Benefits for Students

- **University Placement Offices:** Provides placement training cells with quantitative analytics on cohort employability and specific curriculum gaps.
- **Undergraduate Engineers:** Gives Computer Science students actionable clarity on exactly which technologies to prioritize each semester.
- **Career Switchers & Beginners:** Explores multiple technical tracks without committing to lengthy bootcamps before seeing readiness alignment.
- **Hackathon & Portfolio Preparation:** Highlights high-yield capstone projects designed to turn deficit areas into portfolio strengths.

---

## 4. Technology Stack

### Frontend
- **Architecture:** Reactive Single Page Application (SPA) with zero heavy build tool delays.
- **Styling & UI:** Tailwind CSS with custom design tokens (Deep Indigo `#4F46E5`, Electric Violet `#7C3AED`, Accent Teal `#14B8A6`).
- **Icons & Motion:** Lucide Icons & Canvas Confetti celebration effects.
- **Visualizations:** Native responsive SVG charts (6-Axis Radar Web, Neural Skill Nodes, Bar Charts, Gauges).

### Backend
- **Runtime:** Node.js (v18.0.0+) native HTTP server (`server/src/server.js`).
- **Security:** Cryptographic PBKDF2 password hashing with random salt & HMAC-SHA256 signed JWT session tokens.
- **AI & Analytics Engine:** Deterministic calculation engine (`server/src/services/aiEngine.js`) guaranteeing reliable offline operation with optional external LLM support.
- **Persistence:** File-backed atomic JSON database (`server/data/db.json`) ensuring crash-proof persistence and zero-config local portability.

---

## 5. Architecture & Project Structure

```
EduTwin/
├── .env.example              # Safe environment variable template with placeholders
├── .gitignore                # Bulletproof protection against secrets and temp files
├── package.json              # Project metadata and run scripts
├── README.md                 # Complete project documentation
├── docs/                     # Architecture documentation and guides
│   ├── architecture.md       # Formulas, system diagrams, and data flows
│   └── screenshots/          # Application walkthrough guides
├── public/                   # Client application assets served by backend
│   ├── index.html            # Main HTML5 entry point with Tailwind & Lucide
│   ├── app.js                # Core reactive SPA state store, routing, and views
│   └── styles/
│       └── app.css           # Design tokens, radar styles, and glow effects
└── server/                   # Backend services and persistence
    ├── package.json          # Server package manifest
    ├── data/
    │   └── db.json           # Atomic persistent JSON database with seed data
    └── src/
        ├── server.js         # HTTP server, routing dispatcher, and static file host
        ├── config/
        │   └── db.js         # DB helper methods, benchmarks, and crypto utilities
        ├── routes/
        │   ├── auth.js       # Signup, login, google oauth, forgot-password, demo
        │   ├── students.js   # Student profile CRUD and onboarding
        │   ├── ai.js         # AI analysis, skill gap, career match, and simulation
        │   └── progress.js   # Learning roadmap task toggle and progress logs
        └── services/
            └── aiEngine.js   # Deterministic mathematical simulation engine
```

---

## 6. Prerequisites & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Git:** Git client installed

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shaikbasheera08/EduTwin.git
   cd EduTwin
   ```

2. Optional: Configure environment overrides (default values run out-of-the-box):
   ```bash
   cp .env.example .env
   ```

---

## 7. Local Development & Run Commands

```bash
# Start the full-stack server
node server/src/server.js

# Or using npm
npm start
```

Once started:
- **Local Application:** [http://localhost:5000](http://localhost:5000)
- **API Base:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. Environment Variable Configuration

Use `.env.example` as a template. All keys have sensible, working offline defaults:

```env
# HTTP Port
PORT=5000

# Session signing key
JWT_SECRET=your_jwt_secret_key_here

# Optional: Google OAuth Client ID (for production Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Optional: LLM API Key (deterministic fallback active by default)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 9. 60-Second Hackathon Demo Guide

1. **Landing Page:** Open [http://localhost:5000](http://localhost:5000) to introduce the student problem.
2. **Instant Demo Entry:** Click **"Try Demo Student"** to load the pre-configured profile for **Rahul Kumar**.
3. **Digital Twin Signature View:** Click **Digital Twin** in the sidebar to review the live neural silhouette and 6-axis competency radar.
4. **Skill Gap Analysis:** Navigate to **Skill Gap Analysis** to see the benchmark deficits for *Full Stack Developer*.
5. **What-If Simulation (The WOW Moment):** Go to **What-If Simulation**. Slide React from 30 to 75 and Node.js from 20 to 70. Click **Simulate Future** to demonstrate the calculated readiness jump from **65% to 89% (+24 percentage points)**.
6. **Task Execution:** Check off a task in the **Learning Roadmap** and inspect **Progress Tracking** to verify live database persistence.

---

## 10. Security & Privacy Considerations

- **No Plaintext Passwords:** Credentials are salted and hashed using Node's cryptographic PBKDF2 implementation.
- **HMAC-SHA256 Tokens:** Stateless bearer tokens with 7-day expiration enforce session security.
- **Data Isolation:** Private student profiles are isolated by user IDs.
- **Zero Committed Secrets:** The repository enforces a strict `.gitignore` preventing `.env`, private keys, and credential leaks.

---

## 11. Known Limitations & Future Enhancements

### Current Scope
- Role benchmarks represent calibrated baseline models rather than real-time job scraping feeds.
- Offline deterministic calculation provides high reliability; optional external LLM enhancement can be activated via API keys.

### Future Roadmap
- Integration with GitHub API to automatically verify student code commit history and projects.
- Automated code assessment sandboxes directly validating coding proficiency.
- Direct integration with university LMS systems (Canvas, Moodle).

---

## 12. Contribution Guidelines & License

### Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'feat: add amazing feature'`.
4. Push to branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

### License
Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with ❤️ by **shaikbasheera08** for Open Innovation, AI & Higher Education.
