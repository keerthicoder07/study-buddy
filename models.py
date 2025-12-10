# sentence transformers
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from dotenv import load_dotenv
import os

# Load variables from .env file into environment
load_dotenv()

import nest_asyncio
nest_asyncio.apply()

os.environ["GROQ_API_KEY"] =os.getenv("GROQ_API_KEY")

from llama_index.llms.groq import Groq

llm = Groq(model="llama-3.1-8b-instant")
llm_70b = Groq(model="llama-3.3-70b-versatile")
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")