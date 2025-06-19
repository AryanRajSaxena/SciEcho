from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file if present
client = Groq(api_key= os.getenv("MY_API_KEY"))  # Ensure you have set your API key in the environment

def answer_question(question, top_k_chunks):
    context = "\n\n".join(top_k_chunks)
    prompt = f"""You are a biotech research assistant. Use the context below to answer the user's question.

Context:
{context}

Question:
{question}

Answer:"""

    completion = client.chat.completions.create(
        model="compound-beta",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_completion_tokens=1024
    )
    return completion.choices[0].message.content
