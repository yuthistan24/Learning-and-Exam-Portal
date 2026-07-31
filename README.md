# 🎓 Global Exams — AI-Powered Learning & Examination Platform

A enterprise-grade, next-generation examination platform featuring **subject-specific local AI evaluation models (Ollama)**, **pytesseract OCR answer scanning**, **live multi-language code execution**, **proctoring and malpractice detection**, and **real-time teacher analytics**.

---

## 🌟 Key Features

### 🧠 1. Subject-Specific AI Evaluation (Ollama Microservice)
Unlike standard single-prompt evaluation systems, Global Exams uses a dynamic **Subject Router** that dispatches student answers to specialized local LLM models:
* 💻 **Coding / Programming**: `qwen2.5-coder:1.5b-base` — Validates code structure, syntax, and logic alongside unit test outputs.
* 📐 **Mathematics**: `deepseek-r1:14b` — Step-by-step mathematical reasoning and SymPy symbolic verification.
* 📝 **English & Essays**: `qwen3.5:latest` — Evaluates grammar, semantics, thesis structure, and cohesion.
* 🔬 **Science**: `qwen3.5:latest` — Verifies technical terminology, key concept coverage, and logical derivation.
* 📚 **General Short Answer**: `qwen3.5:latest` — High-speed keyword and semantic similarity grading.

### 📷 2. OCR Answer Scanning (`pytesseract` + `PyMuPDF`)
* **Handwritten Answers**: Students can upload photos of handwritten physical answer sheets during exams. `pytesseract` extracts text automatically for AI grading.
* **Question Paper Import**: Teachers can upload scanned PDF or image question papers. The system automatically parses and drafts questions.

### 💻 3. Live Code Execution Sandbox
* Embedded code editor for programming questions supporting **Python 3**, **C**, **C++**, and **Java**.
* Instant stdout/stderr feedback and automated test case pass/fail verification.

### 🛡️ 4. Proctoring & Malpractice Detection
* Real-time window blur / tab-switch tracking.
* Automated violation logging attached to student result metadata.

### 📊 5. Teacher AI Hub & Score Overrides
* Live evaluation dashboard displaying per-student grading status, AI confidence scores, and specific model used.
* One-click manual score override with instant total grade recalculation.
* On-demand student re-evaluation trigger.

### 🎨 6. Premium Glassmorphic Design System
* Modern UI with adaptive Dark/Light mode theme engine.
* HSL color tokens, micro-animations, toast notifications, and responsive navigation.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Web Browser (Client) │
                                  └───────────┬────────────┘
                                              │ REST API / JSON
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Node.js + Express Backend (Port 5000)                                                  │
│  ├── Auth Routes (/api/auth)          ── JWT Authentication                             │
│  ├── Exam Routes (/api/exams)         ── Question Management                            │
│  ├── Answer Routes (/api/answers)     ── Student Submission & Code Runner               │
│  ├── Evaluation Routes (/api/eval)    ── Teacher Override & Re-evaluation              │
│  └── Result Routes (/api/results)     ── Atomic Upsert & Analytics                      │
└───────────────────────────┬──────────────────────────────────┬─────────────────────────┘
                            │ Mongo DB                         │ HTTP Microservice
                            ▼                                  ▼
                ┌──────────────────────┐          ┌───────────────────────────────────────┐
                │ MongoDB Database     │          │ Python FastAPI Service (Port 8000)    │
                │ • Users / Exams      │          │ ├── SubjectRouter                     │
                │ • Results & Metadata │          │ ├── OllamaEvaluator (Models)          │
                └──────────────────────┘          │ ├── pytesseract OCR                   │
                                                  │ └── Code Execution Engine             │
                                                  └───────────────────┬───────────────────┘
                                                                      │ Local REST API
                                                                      ▼
                                                          ┌───────────────────────┐
                                                          │ Ollama LLM Service    │
                                                          │ • qwen2.5-coder:1.5b  │
                                                          │ • deepseek-r1:14b     │
                                                          │ • qwen3.5:latest      │
                                                          └───────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** v18+
* **Python** 3.10+
* **Tesseract-OCR** (installed on system PATH)
* **MongoDB** (local or cloud instance)
* **Ollama** with models pulled:
  ```bash
  ollama pull qwen2.5-coder:1.5b-base
  ollama pull deepseek-r1:14b
  ollama pull qwen3.5:latest
  ```

---

### Step 1: Start Python Evaluation Microservice

```bash
cd python-evaluator

# Install dependencies (including pytesseract)
python -m pip install -r requirements.txt

# Launch FastAPI microservice (Port 8000)
python main.py
```

### Step 2: Start Node.js Backend Server

```bash
cd backend

# Install dependencies
npm install

# Start Express server (Port 5000)
npm run dev
```

### Step 3: Access Frontend Web Portal

The frontend is served from `frontend/`. Open `frontend/index.html` in your browser or run:

```bash
cd frontend
python -m http.server 8080
```
Then navigate to **`http://localhost:8080`**.

---

## 🔐 Pre-Seeded Demo Accounts

| Role | Email | Password |
|---|---|---|
| 👨‍🏫 **Teacher** | `teacher.ds@college.edu` | `teacher12345` |
| 🛡️ **Admin** | `admin@college.edu` | `admin12345` |
| 🎓 **Student** | Register via [Sign Up](frontend/signup.html) | — |

---

## ⚙️ Environment Configuration

### Python Evaluator (`python-evaluator/.env`)
```env
HOST=0.0.0.0
PORT=8000
OLLAMA_BASE_URL=http://localhost:11434

MODEL_CODING=qwen2.5-coder:1.5b-base
MODEL_MATH=deepseek-r1:14b
MODEL_ENGLISH=qwen3.5:latest
MODEL_SCIENCE=qwen3.5:latest
MODEL_GENERAL=qwen3.5:latest
```

### Node.js Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/global_exams
JWT_SECRET=your_jwt_secret_key_here
PYTHON_EVALUATOR_URL=http://localhost:8000
```

---

## 🧪 Verification & Health Check

* **Python Evaluator Health**: `http://localhost:8000/api/health`
* **OCR Status Check**: `http://localhost:8000/api/ocr/status`
* **Node.js API Health**: `http://localhost:5000/api/health`

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
