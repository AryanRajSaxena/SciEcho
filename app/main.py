from fastapi import FastAPI, UploadFile, File
from app.pdf_parser import extract_text_from_pdf
from .summarizer import summarize_text_with_groq
from .vector_store import ingest_and_store_chunks, get_top_k_chunks
from .qa_engine import answer_question
import io


app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to SciEcho API"}

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    contents = await file.read()

    # Convert bytes to file-like object
    pdf_file = io.BytesIO(contents)

    # Pass to your parser
    text = extract_text_from_pdf(pdf_file)

    summary = summarize_text_with_groq(text)
    ingest_and_store_chunks(text)
    return {"summary": summary}

@app.post("/ask/")
async def ask_question(question: str):
    top_k_chunks = get_top_k_chunks(question)
    answer = answer_question(question, top_k_chunks)
    return {"answer": answer}
