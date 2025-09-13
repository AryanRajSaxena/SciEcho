from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env if running locally

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in the environment")
    return Groq(api_key=api_key)

def summarize_text_with_groq(text):
    client = get_groq_client()  # Create client here
    max_chars = 8000
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    prompt = f"""You are an expert biotech research assistant...
{text}"""

    try:
        completion = client.chat.completions.create(
            model="compound-beta",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error in summarization: {str(e)}")
        return f"Error generating summary: {str(e)}"
