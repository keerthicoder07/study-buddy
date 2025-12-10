# Study Buddy 🎓📚

An intelligent, AI-powered academic assistant that transforms your study materials into interactive learning experiences.

## 🌟 Features

*   **RAG-Powered Q&A**: Upload any PDF note or textbook and chat with it. The AI understands context and gives precise answers based *only* on your material.
*   **Persistent Memory**: The chat engine remembers your previous questions and context (using MongoDB), allowing for natural, flowing conversations.
*   **Proctored Exam Hall**: Generate dynamic, AI-created multiple-choice exams based on your uploaded documents. 
    *   **Anti-Cheating**: Enforces fullscreen mode and tracks tab-switching warnings.
    *   **Auto-Grading**: Instant scores and personalized feedback.
*   **User Authentication**: Secure Login and Signup system to manage individual user sessions and data.
*   **Premium UI**: A modern, dark-mode "Glassmorphism" design built with React and Framer Motion.

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **LLM Engine**: LlamaIndex (Groq Llama-3-70b/8b)
*   **Vector Database**: ChromaDB (Persistent storage)
*   **Database**: MongoDB (User auth & Chat history)
*   **Embeddings**: HuggingFace (BAAI/bge-small-en-v1.5)

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: CSS Modules with Glassmorphism variables
*   **Animations**: Framer Motion
*   **Icons**: Lucide React

## 🚀 Setup & Installation

### Prerequisites
1.  **MongoDB**: Ensure MongoDB is running locally or you have a valid cloud URI.
2.  **Groq API Key**: You need an API key from [Groq Console](https://console.groq.com/).
3.  **Python 3.10+** and **Node.js 16+**.

### 1. Backend Setup
Navigate to the root directory `Rag1`:

```bash
# Create virtual environment (optional but recommended)
python -m venv .venv
# Activate: .venv\Scripts\Activate.ps1 (Windows) or source .venv/bin/activate (Mac/Linux)

# Install Dependencies
pip install fastapi uvicorn llama-index-core llama-index-llms-groq llama-index-embeddings-huggingface llama-index-vector-stores-chroma chromadb pymongo python-dotenv werkzeug

# Configure Environment
# Create a .env file in the root and add:
MONGO_URI=mongodb://localhost:27017/
GROQ_API_KEY=your_groq_api_key_here
```

Run the backend:
```bash
python main.py
```
*Server will start at `http://localhost:8000`*

### 2. Frontend Setup
Open a new terminal and navigate to `frontend`:

```bash
cd frontend

# Install Dependencies
npm install

# Run Development Server
npm run dev
```
*App will open at `http://localhost:5173`*

## 📖 Usage Guide

1.  **Signup/Login**: Create an account to access your personal workspace.
2.  **Upload**: Go to the "Upload Material" tab and drag-and-drop your simplified PDF notes.
3.  **Study Room**: Go to the "Study Room" to ask doubts. The AI recalls previous chat context.
4.  **Exam Hall**: ready to test yourself? Enter the Exam Hall. 
    *   Click "Enter Exam Hall".
    *   **Stay in Fullscreen**: Switching tabs will trigger warnings!
    *   Submit to see your auto-graded score.

## 📂 Project Structure

```
Rag1/
├── api.py                 # FastAPI Routes (Auth, Chat, Upload, Exam)
├── main.py                # Server Entry Point
├── chatloader.py          # LlamaIndex RAG Engine & Mongo Memory Logic
├── ingest.py              # Vector Store Ingestion Logic
├── models.py              # LLM & Embedding Model Config
├── frontend/              # React Application
│   ├── src/
│   │   ├── components/    # (ChatWindow, FileUpload, ProctorSession, etc.)
│   │   ├── App.jsx        # Routing & Layout
│   │   └── index.css      # Global Styles (Glassmorphism)
└── uploads/               # Temporary file storage
```

## 🤝 Contributing
Built by [Your Name/Team]. contributions are welcome!


Project images

<img width="993" height="1079" alt="Screenshot 2025-12-10 105415" src="https://github.com/user-attachments/assets/f36754a2-2741-4e7a-abe8-2a5567c0e638" />
<img width="726" height="1074" alt="Screenshot 2025-12-10 105424" src="https://github.com/user-attachments/assets/589d576c-d319-4080-a2a9-e65d60acfed6" />
<img width="997" height="1068" alt="Screenshot 2025-12-10 105433" src="https://github.com/user-attachments/assets/5f30d14f-333c-4106-adc5-2db0e94662a1" />
<img width="1024" height="1079" alt="Screenshot 2025-12-10 105741" src="https://github.com/user-attachments/assets/6b48f7c0-0481-4d1a-8301-afd03065a9de" />
<img width="1469" height="960" alt="Screenshot 2025-12-10 105908" src="https://github.com/user-attachments/assets/e38927c1-5d16-4483-acef-0c2fc3af911b" />
<img width="1036" height="1069" alt="Screenshot 2025-12-10 105952" src="https://github.com/user-attachments/assets/5d0ca8cb-578d-4da4-97d4-15b33e729a9d" />







