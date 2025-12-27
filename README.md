# Diagram Intent

**Diagram Intent** is an experimental **AI-assisted architectural diagramming tool** built with **Next.js (App Router)**.

Instead of treating AI image generation as a black box, Diagram Intent focuses on **design intent, diagram logic, and prompt clarity**, helping designers translate architectural thinking into structured, controllable diagrams.

---

## 🧠 What is Diagram Intent?

Diagram Intent is designed as a **thinking aid for architectural design**, not just an image generator.

It helps designers:

- Clarify *what* they want to communicate (massing, circulation, zoning, hierarchy)
- Understand *why* vague prompts lead to unstable results
- Iteratively refine design intent before committing to detailed drawings

The tool emphasizes:

> **Intent → Logic → Diagram**

Aligning closely with architectural studio workflows.

---

## ✨ Key Features

### Architectural Diagram Presets
- Massing & Volume
- Circulation Flow
- Program Zoning
- Program Hierarchy
- Spatial Experience
- Design Process
- Custom Prompt

### Prompt Workspace with Intent Feedback
- Real-time **Prompt Strength Analysis**
  - Exploratory → Focused → Precise
- Clear signals explaining *why* a prompt is weak or strong
- Actionable suggestions to improve controllability
- Example prompts (click to insert)
- Design-oriented tags (axonometric, hierarchy, arrows, minimal text, etc.)

### Design Intent Panel
- Summarizes current diagram type, focus, visual language, and generation goal
- Makes the “hidden intent” of a prompt explicit
- Encourages intentional, structured prompting

### Visual Style Control
- **Minimal** — Black & White, diagrammatic clarity
- **Bold** — RGB layers, conceptual emphasis

### Result Gallery
- AI-generated architectural diagrams
- One-click image download

---

## 🛠 Tech & Development

### Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
Open in browser:
👉 http://localhost:3000

📁 Project Structure (Simplified)
app/
 ├─ page.tsx                # Main layout & interaction logic
 ├─ components/
 │   ├─ PromptPanel.tsx     # Prompt workspace & strength analysis
 │   └─ Tooltip.tsx
 ├─ api/
 │   └─ generate-diagrams/  # AI image generation endpoint
 ├─ globals.css
public/
 └─ bg-arch-wireframe.png

🎯 Design Philosophy

Diagram Intent is built on the idea that:

Good diagrams come from clear intent, not just better rendering.

By exposing prompt structure, constraints, and diagram language, the tool encourages designers to think more explicitly about:

Relationships

Hierarchies

Spatial logic

Visual communication

📦 Deployment
npm run build


Deploy via Vercel Dashboard or Vercel CLI.

📄 License

This project is intended for research, learning, and portfolio use.
Feel free to explore or adapt ideas with attribution.