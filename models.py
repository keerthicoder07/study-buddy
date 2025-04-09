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

llm = Groq(model="llama3-8b-8192")
llm_70b = Groq(model="llama3-70b-8192")
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")