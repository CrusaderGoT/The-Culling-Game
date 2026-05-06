<div align="center">

<br />

# ⚔ The Culling Game

**A full-stack implementation of the Culling Games — brought to life as a web application and REST API.**

[![API Status](https://img.shields.io/badge/API-live-brightgreen?style=flat-square&labelColor=0d0d0d)](https://the-culling-games.up.railway.app/docs)
[![Frontend Status](https://img.shields.io/badge/Frontend-beta-orange?style=flat-square&labelColor=0d0d0d)](https://the-culling-games.vercel.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white&labelColor=0d0d0d)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white&labelColor=0d0d0d)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white&labelColor=0d0d0d)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white&labelColor=0d0d0d)](https://www.typescriptlang.org)
[![Last Commit](https://img.shields.io/github/last-commit/CrusaderGoT/The-Culling-Game?style=flat-square&labelColor=0d0d0d&color=555)](https://github.com/CrusaderGoT/The-Culling-Game/commits/main)

<br />

> *The games are real. The stakes are higher. May your technique hold.*

<br />

[**→ Play**](https://the-culling-games.vercel.app) · [**→ API Docs**](https://the-culling-games.up.railway.app/docs)

<br />

---

![The Culling Game — add a screenshot here](https://placehold.co/900x480/0d0d0d/444444?text=Add+a+screenshot+of+the+platform)

> 💡 Replace the image above with an actual screenshot of the platform.

---

</div>

## Overview

The Culling Game is a fan-built web platform inspired by the [r/thecullinggames](https://reddit.com/r/thecullinggames) community. Players register, define their cursed techniques, join colonies, and battle opponents through a community-driven voting system — all backed by a robust REST API and a responsive frontend.

The project is split into two directories:

- **`BACKEND`** — FastAPI application handling game logic, authentication, database models, and all API routes. Deployed on Railway.
- **`FRONTEND`** — Next.js application handling the UI, user interactions, and API consumption. Deployed on Vercel. *(Currently in beta.)*

---

## Game Mechanics

### Users & Players
To participate, you register as a **User**, then create a **Player** — your fighter in the games. A user can cast votes, manage their player, and interact with the broader game world.

### Cursed Technique
Every player has a **Cursed Technique** — their core ability. Each technique contains between one and five **applications**, which other players vote on during matches.

### Barrier Techniques
Higher-grade players unlock **Barrier Techniques** — advanced abilities like Domain Expansion, Simple Domain, and Binding Vow. These grant vote multipliers and combat buffs, giving seasoned players a significant edge.

### Points & Grades
Players accumulate **points** through votes and match victories. Points are used to activate barrier techniques and upgrade player grade — starting from Grade 4 and climbing toward Special Grade.

### Colonies
Players are assigned to a **Colony** — a group of ten fighters situated in a real-world country. All matches take place within a colony, and players fight only those in their own. Each colony is identified by both its number and its country.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend Framework** | FastAPI | 0.100+ |
| **Language (Backend)** | Python | 3.11+ |
| **Data Validation** | Pydantic | v2 |
| **ORM** | SQLModel / SQLAlchemy | latest |
| **Database** | PostgreSQL | — |
| **Migrations** | Alembic | latest |
| **Backend Deployment** | Railway | — |
| **Frontend Framework** | Next.js (App Router) | 15 |
| **Language (Frontend)** | TypeScript | 5 |
| **Frontend Deployment** | Vercel | — |

---

## Getting Started

### Prerequisites

- **Python** `>= 3.11`
- **Node.js** `>= 20`
- **pnpm** (recommended) or npm
- A **PostgreSQL** database instance

### 1. Clone the repository

```bash
git clone https://github.com/CrusaderGoT/The-Culling-Game.git
cd The-Culling-Game
```

### 2. Backend setup

```bash
cd BACKEND
pip install -r requirements.txt
```

Create a `.env` file in the `BACKEND` directory:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
```

Run migrations:

```bash
alembic upgrade head
```

Start the development server:

```bash
uvicorn app.api.main:app --reload
```

API will be available at [http://localhost:8000](http://localhost:8000) · Docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend setup

```bash
cd ../FRONTEND
pnpm install
```

Create a `.env.local` file in the `FRONTEND` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the development server:

```bash
pnpm dev
```

Frontend will be available at [http://localhost:3000](http://localhost:3000)

---

## API Documentation

The live API is fully documented via FastAPI's interactive Swagger UI.

**→ [https://the-culling-games.up.railway.app/docs](https://the-culling-games.up.railway.app/docs)**

All routes are documented with request/response schemas, authentication requirements, and example payloads.

---

## Contributing

Contributions are welcome — the project is actively developed and there's meaningful work across the stack.

**Areas where help is appreciated:**

- **Frontend** — The UI is in beta. Design improvements, dashboard work, and component refinements are all open. If you have an eye for design or experience with Next.js, jump in.
- **Backend** — Additional admin routes, match endpoints, and middleware improvements are in progress. SQLModel / Pydantic / FastAPI experience is ideal.
- **Documentation** — Improving code comments, fixing grammar, or expanding this README are all valuable contributions.

**To contribute:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with clear messages
4. Open a Pull Request describing what you've done and why

For larger changes, open an issue first to discuss the approach.

---

<div align="center">

<br />

Built by **[CrusaderGoT](https://github.com/CrusaderGoT)** · Inspired by the community at [r/thecullinggames](https://reddit.com/r/thecullinggames)

*May your technique hold.*

<br />

</div>
