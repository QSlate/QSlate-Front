# QSlate - Frontend 🚀

> The "Flight Simulator" for Quantitative Finance (Epitech Innovative Project - EIP)

## 📖 Overview

QSlate resolves the "Missing Middle" in algorithmic trading by combining the visual accessibility of modern web applications with the computational power of a compiled execution engine.

This repository (`QSlate-Front`) houses the **Frontend** of the QSlate platform. It acts as the visualizer and dispatcher for the overarching ecosystem, providing a hyper-modular, low-latency dashboard for quantitative analysts and retail traders alike.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, React Server Components)
- **Styling:** Tailwind CSS v4
- **State Management:**
  - **Server State:** TanStack Query (React Query)
  - **Client State:** Zustand
- **Interactive UI:**
  - Monaco Editor (Dynamic import for Mini IDE)
  - React Grid Layout (Dynamic Lab / Grid Dashboard)
  - Lightweight Charts (Canvas-based financial charts)
- **Tooling:** ESLint, Prettier, Husky, lint-staged, commitlint

## 🏗 Architecture: Feature-Sliced Design (FSD)

The `src/` directory strictly follows domain-driven Feature-Sliced Design to maintain a hyper-modular codebase. Dependencies flow strictly downwards: a layer can only import from layers below it.

- **`app/`**: Next.js routing, layouts, and global providers. No complex UI logic here.
- **`widgets/`**: Independent, complex UI blocks combining multiple features and entities (e.g., `MiniIDE`, `DynamicGrid`, `EquityCurveChart`).
- **`features/`**: Specific user interactions and business actions (e.g., `run-backtest`, `user-auth`).
- **`entities/`**: Domain data models, TypeScript interfaces, and pure data-fetching logic (e.g., `bot`, `market-data`).
- **`shared/`**: Agnostic foundational code, UI components (`shared/ui/Button`), API clients (`shared/api/grpc-client`), and utils.

## ⚡️ Rendering Strategy & Core Paradigms

- **Default to Server Components (RSC):** Data fetching, layout orchestration, and SEO metadata happen on the server.
- **Strict Client Boundaries (`"use client"`):** Interactivity is pushed to the client only when absolutely necessary (e.g., WebSockets, drag-and-drop grid interactions).
- **Dynamic Imports:** Heavy client-side libraries (like Monaco Editor) MUST be loaded dynamically (`ssr: false`) to prevent hydration mismatches and server crashes.
- **Backend Integration:** The frontend does not perform heavy quantitative calculations.
  - **WebSockets:** Real-time streaming for tick-level data and backtest execution progress.
  - **gRPC / REST:** Standard CRUD operations routed to the Go orchestration backend.

## ♿ Accessibility (a11y) & Inclusive Design System

QSlate strictly adheres to **WCAG 2.1 Level AA** standards.

- **Color-Blindness (Daltonism Mode):** Native Orange/Blue alternative to standard Red/Green for profit/loss representation, plus directional icons and stroke patterns.
- **Cognitive Ergonomics:** High-contrast matte dark theme (`#050505` / `bg-matte`) to minimize eye fatigue.
- **Precision Typography:** **JetBrains Mono** is enforced for all tabular data, numeric outputs, and the Mini IDE to ensure strict character alignment.
- **Screen Readers:** Visual canvas charts (Lightweight Charts) are supplemented with visually hidden, semantic HTML `<table>` structures and ARIA landmarks (`role="region"`, `aria-label`).

## 🛡 Quality Gates & Tooling

Code quality is uncompromising. The repository enforces strict validation at the pre-commit stage:

- **Husky & lint-staged:** Intercepts git hooks to run linters only on staged files for speed.
- **Commitlint:** Enforces Conventional Commits (`feat`, `fix`, `chore`) for automated changelogs.
- **Strict TypeScript:** `strict`, `noImplicitAny`, `strictNullChecks`, etc., are enforced in `tsconfig.json`.
- **ESLint & Prettier:** Configured with simple-import-sort to ensure uniform codebase syntax and import ordering.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v22.12.0+)
- **npm** (or yarn/pnpm/bun)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd QSlate-Front

# Install dependencies
npm install

# Initialize husky hooks (if not automatically run)
npm run prepare
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build & Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm run start
```

---

_Built with precision for the next generation of quantitative researchers._
