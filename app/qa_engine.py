import requests

def answer_question(question, top_k_chunks):
    context = "\n\n".join(top_k_chunks)
    prompt = f"""You are a biotech research assistant. Use the context below to answer the user's question.

Context:
{context}

Question:
{question}

Answer:"""
    headers = {"Authorization": "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"}
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json={
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }, headers=headers)
    return response.json()["choices"][0]["message"]["content"]