import os
from llama_index.core import Settings
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.chat_engine.types import ChatMode
from llama_index.core.chat_engine import CondenseQuestionChatEngine, ContextChatEngine
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.llms import ChatMessage, MessageRole
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

from ingest import index  # your vector index
from models import llm    # your LLM config

# Load .env variables
load_dotenv()

# Set global LLM
Settings.llm = llm

# MongoDB config
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "studybuddy"
USERS_COLLECTION = "users"
SESSIONS_COLLECTION = "chat_sessions"

# Initialize MongoDB client
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
users_collection = db[USERS_COLLECTION]
sessions_collection = db[SESSIONS_COLLECTION]

# Set up retriever
retriever = VectorIndexRetriever(index=index, similarity_top_k=3)

def get_or_create_session(user_id, session_id):
    """Ensures a session document exists."""
    if not sessions_collection.find_one({"session_id": session_id}):
        sessions_collection.insert_one({
            "user_id": user_id,
            "session_id": session_id,
            "title": "New Chat",
            "created_at": datetime.utcnow(),
            "messages": []
        })

def save_message_to_mongo(session_id, message: dict):
    """Appends a message to the session's message list."""
    # message dict should be {"role": "user"|"bot", "text": "..."}
    sessions_collection.update_one(
        {"session_id": session_id},
        {"$push": {"messages": message}}
    )

def get_chat_history_messages(session_id):
    """Fetches raw message dicts from Mongo."""
    doc = sessions_collection.find_one({"session_id": session_id})
    return doc["messages"] if doc else []

def get_chat_engine(session_id: str):
    """Creates a chat engine with memory loaded from MongoDB."""
    
    # 1. Fetch history from Mongo
    raw_history = get_chat_history_messages(session_id)
    
    # 2. Convert to LlamaIndex ChatMessage objects
    chat_history = []
    for msg in raw_history:
        role = MessageRole.USER if msg['role'] == 'user' else MessageRole.ASSISTANT
        chat_history.append(ChatMessage(role=role, content=msg['text']))
    
    # 3. Create Memory Buffer with this history
    memory = ChatMemoryBuffer.from_defaults(chat_history=chat_history)
    
    # 4. Create Engine with memory
    # Using ContextChatEngine (or CondenseQuestion) with memory to enable "NLP" contextual understanding
    return CondenseQuestionChatEngine.from_defaults(
        query_engine=RetrieverQueryEngine(retriever=retriever),
        # retriever=retriever, # CondenseQuestion uses query_engine internally usually, but let's stick to defaults
        chat_mode=ChatMode.CONDENSE_QUESTION,
        memory=memory,
        verbose=True
    )
