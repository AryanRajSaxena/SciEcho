from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in the environment")
    return Groq(api_key=api_key)

def answer_question(question, top_k_chunks):
    client = get_groq_client()
    context = "\n\n".join(top_k_chunks)
    
    prompt = f"""You are a biotech research assistant...
Context from Research Paper:
{context}

Question: {question}

Answer:"""

    try:
        completion = client.chat.completions.create(
            model="compound-beta",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error in Q&A: {str(e)}")
        return f"Error generating answer: {str(e)}"
