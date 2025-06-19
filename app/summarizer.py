from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # if using .env
client = Groq(api_key=os.getenv("MY_API_KEY"))  # Or pass directly

def summarize_text_with_groq(text):
    prompt = f"Summarize the following biotech research paper text:\n\n{text[:5000]}"

    completion = client.chat.completions.create(
        model="compound-beta",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1024
    )

    return completion.choices[0].message.content
