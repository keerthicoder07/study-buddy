from llama_index.readers.file import PyMuPDFReader
from llama_index.core.node_parser import SentenceSplitter
from ingest import vector_store
from models import embed_model
loader = PyMuPDFReader()
documents = loader.load(file_path="C:/Users/keerthi/AI innovation/Rag1/tata/TiagoBSVI_542458409905_Rev 00_07_01_20.pdf")

text_parser = SentenceSplitter(
    chunk_size=1024,
    # separator=" ",
)

text_chunks = []
# maintain relationship with source doc index, to help inject doc metadata in (3)
doc_idxs = []
for doc_idx, doc in enumerate(documents):
    cur_text_chunks = text_parser.split_text(doc.text)
    text_chunks.extend(cur_text_chunks)
    doc_idxs.extend([doc_idx] * len(cur_text_chunks))

from llama_index.core.schema import TextNode

nodes = []
for idx, text_chunk in enumerate(text_chunks):
    node = TextNode(
        text=text_chunk,
    )
    src_doc = documents[doc_idxs[idx]]
    node.metadata = src_doc.metadata
    nodes.append(node)
for node in nodes:
    node_embedding = embed_model.get_text_embedding(
        node.get_content(metadata_mode="all")
    )
    node.embedding = node_embedding

vector_store.add(nodes)
#print(vector_store._collection.get())  # Check the stored dimension