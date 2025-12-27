# AI Diagram Generator

An experimental **AI-assisted architectural diagram generator** built with **Next.js (App Router)**.  
This tool helps designers quickly explore **massing, circulation, zoning, program hierarchy, and spatial concepts** through structured prompts and AI-generated diagrams.

The project focuses on **prompt clarity, design intent, and controllability**, rather than treating AI as a black box.

---

## ✨ Features

- **Architectural diagram presets**
    - Massing & Volume
    - Circulation Flow
    - Program Zoning
    - Program Hierarchy
    - Spatial Experience
    - Design Process
    - Custom prompt

- **Prompt Workspace with feedback**
    - Real-time **Prompt Strength analysis** (Exploratory → Focused → Precise)
    - Signals & suggestions to improve prompt clarity
    - Example prompts (click to insert)
    - Design-oriented tags (axonometric, hierarchy, arrows, etc.)

- **Design Intent Panel**
    - Summarizes current diagram type, focus, visual language, and generation goal
    - Helps users understand *what* they are actually asking the AI to generate

- **Style control**
    - Minimal (Black & White)
    - Bold (RGB / conceptual layers)

- **Result gallery**
    - AI-generated diagrams
    - One-click download

---

## 🧠 Why this project?

Most AI image tools focus on visual novelty.  
This project explores how **architectural thinking can be encoded into prompts**, helping users:

- Translate design intent into structured language
- Understand why vague prompts produce unstable results
- Iteratively refine ideas before committing to detailed design work

It is designed as a **thinking aid**, not a replacement for design judgment.

---

## 🛠 Tech Stack

- **Next.js 14** (App Router)
- **React (Client Components)**
- **TypeScript**
- **Tailwind CSS**
- **AI image generation API** (via `/api/generate-diagrams`)
- Deployed-ready for **Vercel**

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install
# or
yarn
# or
pnpm install
