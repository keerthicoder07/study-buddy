from llama_index.core.query_engine import RetrieverQueryEngine
from retriver import retriever
from models import llm
query_engine = RetrieverQueryEngine.from_args(retriever, llm=llm)
query_str = "Define Register Addressing mode and give example?"

response = query_engine.query(query_str)
print(str(response))

print(response.source_nodes[0].get_content())