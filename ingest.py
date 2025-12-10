from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import chromadb
import os

# Configuration
PERSIST_DIR = "./chroma_db"
COLLECTION_NAME = "studybuddy_collection"

# setup embedding model
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# setup chroma
db = chromadb.PersistentClient(path=PERSIST_DIR)
chroma_collection = db.get_or_create_collection(COLLECTION_NAME)
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def load_index():
    return VectorStoreIndex.from_vector_store(
        vector_store,
        embed_model=embed_model,
    )

# Global index instance
index = load_index()

def ingest_file(file_path: str):
    """Ingests a single file into the vector store."""
    print(f"Ingesting file: {file_path}")
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    for doc in documents:
        index.insert(doc)
    print("Ingestion complete.")
    return True
