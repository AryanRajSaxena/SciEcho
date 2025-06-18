from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')
index = faiss.IndexFlatL2(384)
text_chunks = []

# Simple chunking

def chunk_text(text, max_words=100):
    words = text.split()
    return [" ".join(words[i:i+max_words]) for i in range(0, len(words), max_words)]

def ingest_and_store_chunks(text):
    global text_chunks
    text_chunks = chunk_text(text)
    embeddings = model.encode(text_chunks)
    index.add(np.array(embeddings))

def get_top_k_chunks(query, k=5):
    query_embedding = model.encode([query])
    D, I = index.search(np.array(query_embedding), k)
    return [text_chunks[i] for i in I[0]]