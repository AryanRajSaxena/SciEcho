from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file if present
client = Groq(api_key=os.getenv("MY_API_KEY"))  # Ensure you have set your API key in the environment

def summarize_text_with_groq(text):
    # Limit text to avoid token limits
    max_chars = 8000
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    prompt = f'''You are an expert biotech research assistant. Analyze the following research paper and provide a comprehensive summary.

Please structure your summary as follows:

**Paper Overview**
- Brief description of the research topic and objectives

**Key Methodology**
- Main experimental approaches and techniques used

**Major Findings**
- Most important results and discoveries

**Conclusions & Implications**
- What the authors concluded and potential impact

**Limitations**
- Any limitations mentioned by the authors

Keep the summary detailed but accessible, focusing on the most important scientific content.

Research Paper Content:
{text}'''

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error in summarization: {str(e)}")
        return f"Error generating summary: {str(e)}"