This is a prototype for a research tool that:
- Uploads a biotech PDF
- Summarizes it with Groq's LLaMA 3
- Allows follow-up questions using RAG

Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```

Run the frontend:
```bash
streamlit run ui/app.py
```

Replace `YOUR_GROQ_API_KEY` in two places with your actual Groq key.