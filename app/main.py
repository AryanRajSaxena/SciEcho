from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from app.pdf_parser import extract_text_from_pdf
from app.summarizer import summarize_text_with_groq
from app.vector_store import ingest_and_store_chunks, get_top_k_chunks
from app.qa_engine import answer_question
import io

app = FastAPI()

# Add CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SciEcho API - Biotech Research Assistant"}

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            return {"error": "Only PDF files are allowed"}
        
        # Read file contents
        contents = await file.read()
        
        # Convert bytes to file-like object
        pdf_file = io.BytesIO(contents)
        
        # Extract text from PDF
        print(f"Processing PDF: {file.filename}")
        text = extract_text_from_pdf(pdf_file)
        
        if not text or len(text.strip()) < 100:
            return {"error": "Could not extract sufficient text from PDF. Please ensure the PDF contains readable text."}
        
        print(f"Extracted {len(text)} characters from PDF")
        
        # Generate summary using Groq
        print("Generating summary with Groq...")
        summary = summarize_text_with_groq(text)
        
        # Store chunks for Q&A
        print("Storing text chunks for Q&A...")
        ingest_and_store_chunks(text)
        
        return {
            "message": "PDF processed successfully",
            "filename": file.filename,
            "summary": summary,
            "text_length": len(text)
        }
        
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return {"error": f"Failed to process PDF: {str(e)}"}

@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    try:
        print(f"Received question: {question}")
        
        # Get relevant chunks from vector store
        top_k_chunks = get_top_k_chunks(question, k=5)
        
        if not top_k_chunks:
            return {"error": "No document content available. Please upload a PDF first."}
        
        print(f"Found {len(top_k_chunks)} relevant chunks")
        
        # Generate answer using Q&A engine
        answer = answer_question(question, top_k_chunks)
        
        return {
            "question": question,
            "answer": answer,
            "chunks_used": len(top_k_chunks)
        }
        
    except Exception as e:
        print(f"Error answering question: {str(e)}")
        return {"error": f"Failed to answer question: {str(e)}"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "SciEcho API is running"}