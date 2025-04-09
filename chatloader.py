# chatloader.py

from llama_index.core import Settings
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.chat_engine.types import ChatMode
from llama_index.core.chat_engine import CondenseQuestionChatEngine
from llama_index.storage.chat_store.mongo import MongoChatStore

from ingest import index  # Your index
from models import llm    # Your LLM

# Set global LLM
Settings.llm = llm

# MongoDB Configuration
MONGO_URI = "mongodb+srv://keerthiofficial007:keerthi123@cluster0.jcdfyfx.mongodb.net/?appName=Cluster0"
DB_NAME = "studybuddy"
COLLECTION_NAME = "chatHistory"

# Create MongoDB chat store
chat_store = MongoChatStore(
    mongo_uri=MONGO_URI,
    db_name=DB_NAME,
    collection_name=COLLECTION_NAME
)

# Create retriever and query engine
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=3
)
query_engine = RetrieverQueryEngine(retriever=retriever)

# Function to create a session-based chat engine
def get_chat_engine(session_id: str):
    chat_engine = CondenseQuestionChatEngine.from_defaults(
        query_engine=query_engine,
        retriever=retriever,
        chat_store=chat_store,
        chat_mode=ChatMode.CONDENSE_QUESTION,
        verbose=True,
        chat_store_session_id=session_id
    )
    return chat_engine
