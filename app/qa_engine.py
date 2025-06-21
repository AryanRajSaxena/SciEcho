from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file if present
client = Groq(api_key=os.getenv("MY_API_KEY"))  # Ensure you have set your API key in the environment

def answer_question(question, top_k_chunks):
    context = "\n\n".join(top_k_chunks)
    
    prompt = f"""You are a biotech research assistant. Use the context below to answer the user's question accurately and comprehensively.

Guidelines:
- Base your answer strictly on the provided context
- Reference specific sections or data when possible
- If the question cannot be fully answered from the context, clearly state this
- Provide detailed explanations for complex topics
- Use clear formatting with bullet points or numbered lists when appropriate

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