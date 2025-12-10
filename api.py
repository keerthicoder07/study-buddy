from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

from chatloader import get_chat_engine, save_message_to_mongo, get_chat_history_messages, get_or_create_session, users_collection, sessions_collection
from ingest import ingest_file

router = APIRouter()

# --- Pydantic Models ---
class AuthRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

class FeedbackRequest(BaseModel):
    session_id: str
    rating: str 
    comments: Optional[str] = None

class QAStartRequest(BaseModel):
    session_id: str
    topic: str

class QASubmitRequest(BaseModel):
    session_id: str
    answers: List[dict] 

# --- Auth Endpoints ---
@router.post("/auth/signup")
async def signup(request: AuthRequest):
    if users_collection.find_one({"username": request.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = generate_password_hash(request.password)
    user_id = users_collection.insert_one({
        "username": request.username,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "chat_sessions": []
    }).inserted_id
    
    return {"status": "success", "user_id": str(user_id)}

@router.post("/auth/login")
async def login(request: AuthRequest):
    user = users_collection.find_one({"username": request.username})
    if not user or not check_password_hash(user["password"], request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"last_active": datetime.utcnow()}})
    return {"status": "success", "user_id": str(user["_id"]), "username": user["username"]}

# --- Core Attributes ---

@router.post("/upload")
async def upload_file(user_id: str, file: UploadFile = File(...)):
    print(f"Received upload request for user: {user_id}") # Debug
    try:
        # Save file specific to user/session could be better, but simpler for now
        temp_dir = f"uploads/{user_id}"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        print(f"Saving file to: {file_path}") # Debug
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print("File saved. Starting ingestion...") # Debug
        ingest_file(file_path) # Ingests into the global index
        print("Ingestion successful.") # Debug
        
        return {"status": "success", "filename": file.filename, "message": "File processed successfully"}
    except Exception as e:
        print(f"UPLOAD ERROR: {str(e)}") # Debug - explicit print
        # import traceback
        # traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.get("/chat/history/{session_id}")
async def get_history(session_id: str):
    history = get_chat_history_messages(session_id)
    return {"history": history}

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Ensure session exists
        get_or_create_session(request.user_id, request.session_id)
        
        # Get engine (loads history)
        chat_engine = get_chat_engine(request.session_id)
        
        # Log User Message
        save_message_to_mongo(request.session_id, {"role": "user", "text": request.message})
        
        # Generate Response
        response = chat_engine.chat(request.message)
        bot_reply = str(response.response)
        
        # Log Bot Message
        save_message_to_mongo(request.session_id, {"role": "bot", "text": bot_reply})
        
        return {"response": bot_reply}
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    print(f"Feedback: {request.rating}")
    return {"status": "success"}

@router.post("/qa/start")
async def start_qa(request: QAStartRequest):
    try:
        # Get engine
        chat_engine = get_chat_engine(request.session_id)
        
        # Prompt for JSON
        prompt = (
            "Generate 5 multiple choice questions based on the content of the uploaded document. "
            "Return the response as a STRICT JSON array of objects. "
            "Each object must have: 'id' (number), 'question' (string), 'options' (list of 4 strings), and 'answer' (string, must match one of the options exactly). "
            "Do not include any markdown formatting like ```json. Just the raw JSON string."
        )
        
        response = chat_engine.chat(prompt)
        response_text = str(response.response).strip()
        
        # Clean potential markdown
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        import json
        questions_data = json.loads(response_text)
        
        # Extract correct answers to store
        exam_key = []
        client_questions = []
        
        for q in questions_data:
            exam_key.append({
                "id": q["id"],
                "correct_answer": q["answer"]
            })
            # Remove answer from client payload
            q_client = q.copy()
            del q_client["answer"]
            client_questions.append(q_client)
            
        # Store key in session
        sessions_collection.update_one(
            {"session_id": request.session_id},
            {"$set": {"exam_key": exam_key}},
            upsert=True
        )
        
        return {"status": "started", "mode": "proctored", "questions": client_questions}
        
    except Exception as e:
        print(f"Exam Gen Error: {e}")
        # Fallback Mock Data if LLM fails
        fallback_questions = [
            {"id": 1, "question": "The system encountered an error generating questions effectively. Is this a fallback?", "options": ["True", "False", "Maybe", "Unknown"], "answer": "True"},
            {"id": 2, "question": "Which component is responsible for logic operations?", "options": ["ALU", "CU", "Memory", "Bus"], "answer": "ALU"},
            {"id": 3, "question": "What does CPU stand for?", "options": ["Central Processing Unit", "Central Power Unit", "Computer Personal Unit", "Central Process Unit"], "answer": "Central Processing Unit"},
            {"id": 4, "question": "RAM is volatile memory.", "options": ["True", "False"], "answer": "True"},
            {"id": 5, "question": "ROM stands for Read Only Memory.", "options": ["True", "False"], "answer": "True"}
        ]
        
        exam_key = []
        client_questions = []
        for q in fallback_questions:
            exam_key.append({"id": q["id"], "correct_answer": q["answer"]})
            q_client = q.copy()
            del q_client["answer"]
            client_questions.append(q_client)
            
        sessions_collection.update_one(
            {"session_id": request.session_id},
            {"$set": {"exam_key": exam_key}},
            upsert=True
        )

        return {
            "status": "started", 
            "mode": "proctored",
            "questions": client_questions
        }

@router.post("/qa/submit")
async def submit_qa(request: QASubmitRequest):
    try:
        session = sessions_collection.find_one({"session_id": request.session_id})
        if not session or "exam_key" not in session:
            return {"status": "error", "message": "Session or exam data not found"}
            
        exam_key = session["exam_key"]
        user_answers = request.answers # List of {id, answer}
        
        score = 0
        total = len(exam_key)
        
        # O(N^2) but N=5 so it's fine
        for key_item in exam_key:
            for user_item in user_answers:
                if str(user_item.get("id")) == str(key_item["id"]):
                    if user_item.get("answer") == key_item["correct_answer"]:
                        score += 1
                        
        percentage = (score / total) * 100 if total > 0 else 0
        
        feedback = "Needs Improvement"
        if percentage >= 90:
            feedback = "Excellent"
        elif percentage >= 70:
            feedback = "Good"
            
        return {"status": "submitted", "score": percentage, "feedback": feedback, "correct_count": score, "total": total}
        
    except Exception as e:
        print(f"Grading Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
