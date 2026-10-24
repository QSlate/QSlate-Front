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

If development compilation repeatedly reports `Can't resolve 'tailwindcss'` from a parent directory after a project-root change, stop the development server and regenerate its cache from `QSlate-Front`:

```bash
node -e "require('node:fs').rmSync('.next/dev', { recursive: true, force: true })"
npm run dev
```

This clears only generated development files. Dependencies and the production build are preserved.

### Build & Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm run start
```

---

_Built with precision for the next generation of quantitative researchers._

## Lab Workspace

Open `/lab` for the interactive workspace based on the [Lab Figma design](https://www.figma.com/design/mAu7DgM3b9HPtf5g8A4u1z/Qslate-Design-V1?node-id=16-3).

- Configure a strategy, date range, timeframe and initial USD capital. Run the simulation with **Run Backtest** or **Ctrl/Cmd + Enter**.
- Inspect portfolio equity against SPX, monthly returns, execution metrics and the latest 100 trades. Dates and timestamps use UTC. The OOS badge covers the final 70% of the synthetic equity series.
- Drag, resize, pin, minimize, expand or close widgets. **Add Widget** restores closed widgets and provides keyboard-accessible layout controls. The reset icon restores the default four-widget layout.
- Widget geometry and visibility are saved in browser local storage under `qslate_lab_layout`. Theme, colorblind mode and sidebar preferences use the existing user store. On narrow screens the widgets stack without overwriting the desktop layout.
- Mini IDE, Marketplace, Backtest Runs and Settings remain disabled until their pages are implemented.

### Demo data and backend integration

The workspace uses deterministic synthetic data, marked **DEMO** and **SIMULATED**. No backtest or market-data backend is contacted. Prices, trades and returns are fixtures for exercising the interface; metrics are illustrative summaries of those fixtures, not validated financial analytics. Form parameters are applied when a simulation completes; previous results remain visible while it runs or if it fails.

`src/entities/backtest/model/types.ts` defines the configuration, result and `BacktestService` contracts. `BacktestProvider` accepts a service with `run(config, signal): Promise<BacktestResult>`; its current default is `mockBacktestService`. When backend contracts are available, implement an adapter at this boundary, map its response into `BacktestResult`, and pass it to the provider. Preserve cancellation, error handling and server-provided quantitative metrics. The backend adapter must replace the demo strategy catalog and initial demo result as part of that integration.

### Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit` and `npm run build`. Targeted tests cover configuration validation, mock-result consistency, cancellation, duplicate submissions, retry, widget lifecycle and layout persistence. Manually verify `/lab` at desktop, tablet and mobile widths, including keyboard navigation, both themes, colorblind mode and reload persistence.
