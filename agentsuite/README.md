# 🤖 AgentSuite

> **A modern agentic workflow automation platform that enables users to design, orchestrate, execute, and monitor intelligent automation workflows through a visual interface powered by FastAPI, React, PostgreSQL, Redis, and Celery.**

<p align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite\&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi\&logoColor=white)
![Python](https://img.shields.io/badge/Python-3-3776AB?logo=python\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql\&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis\&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-Task_Queue-37814A?logo=celery\&logoColor=white)

</p>

---

# 🌐 Live Demo

**API**

https://agentsuite-api.onrender.com

> Add the frontend URL here once it is deployed.

---

# 📖 Overview

AgentSuite is a full-stack automation platform designed to simplify the creation and execution of intelligent workflows.

The platform allows users to visually design automation pipelines, coordinate background tasks, monitor execution, and manage agent-driven processes through a scalable architecture built for modern automation systems.

It demonstrates production-ready concepts including asynchronous task processing, REST APIs, authentication, workflow orchestration, visual editors, state management, and distributed background workers.

---

# ✨ Features

## Workflow Builder

* Visual workflow editor
* Drag-and-drop workflow design
* Configurable workflow nodes
* Workflow validation
* Modular workflow architecture

---

## Automation Engine

* Execute automation pipelines
* Multi-step task orchestration
* Background task execution
* Workflow scheduling
* Job execution monitoring

---

## Agent Management

* Intelligent agent orchestration
* Task delegation
* Agent execution lifecycle
* Configurable automation agents

---

## Dashboard

* Workflow overview
* Execution statistics
* Performance metrics
* Activity monitoring
* Automation insights

---

## Authentication

* User registration
* Secure login
* JWT authentication
* Protected API routes
* Password hashing

---

## Background Processing

* Redis task queue
* Celery workers
* Asynchronous processing
* Retry mechanisms
* Scalable execution

---

# 🛠 Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Query
* Zustand
* React Hook Form
* Zod
* Axios
* Framer Motion
* React Router
* Recharts
* XYFlow (React Flow)

---

## Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Alembic
* Redis
* Celery
* JWT Authentication
* HTTPX

---

## Infrastructure

* Render
* PostgreSQL
* Redis
* Celery Workers

---

# 🏗 System Architecture

```text
                    React + TypeScript
                           │
                    React Query
                           │
                        Axios API
                           │
                    FastAPI Backend
                           │
              Authentication Layer
                           │
                    SQLAlchemy ORM
                           │
                     PostgreSQL
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Redis Queue      Celery Workers    Workflow Engine
        │                  │                  │
        └──────────── Agent Execution Pipeline ────────────┘
```

---

# 📂 Project Structure

```text
agentsuite/

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── layouts/
│   └── types/
│
backend/
│
├── app/
├── api/
├── models/
├── services/
├── workflows/
├── workers/
├── database/
└── main.py
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/ANUU6134/agentsuite.git

cd agentsuite
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Backend

Create and activate a virtual environment.

Linux/macOS

```bash
python -m venv venv

source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Run the backend.

```bash
uvicorn main:app --reload
```

---

# ⚙ Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost/database

SECRET_KEY=your_secret_key

REDIS_URL=redis://localhost:6379

CLIENT_URL=http://localhost:5173
```

---

# 📊 Core Modules

* Authentication
* Workflow Builder
* Agent Manager
* Automation Engine
* Dashboard
* Analytics
* Task Queue
* Execution Monitoring

---

# 🔒 Security

* JWT Authentication
* Password Hashing
* Protected Routes
* Secure Environment Variables
* SQLAlchemy ORM
* Argon2 Password Hashing

---

# ⚡ Scalability

AgentSuite is designed with scalability in mind through:

* Asynchronous background processing
* Distributed task execution
* Redis-backed queues
* Modular workflow architecture
* Stateless REST APIs
* Database migrations with Alembic

---

# 🚀 Deployment

Frontend

* Vercel, Render, or Netlify

Backend

* FastAPI
* Render
* PostgreSQL
* Redis
* Celery Workers

API Endpoint

https://agentsuite-api.onrender.com

---

# 🗺 Roadmap

Future enhancements include:

* AI-assisted workflow generation
* Multi-agent collaboration
* Workflow templates
* Third-party integrations
* Webhook support
* OAuth providers
* Real-time execution logs
* Workflow versioning
* Team workspaces
* Plugin marketplace

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Mohammed Hussen**

Full Stack Developer • Automation Engineer • Python Developer

GitHub: https://github.com/ANUU6134

---

⭐ If you found this project useful, please consider giving it a star.
