import streamlit as st
import requests

from pdf_parser import extract_text_from_pdf
from summarizer import summarize_text_with_groq
from qa_engine import answer_question

st.title("🧬 SciEcho - Biotech Research Summarizer + Q&A Bot")

if "pdf_text" not in st.session_state:
    st.session_state.pdf_text = ""
if "summary" not in st.session_state:
    st.session_state.summary = ""
if "top_chunks" not in st.session_state:
    st.session_state.top_chunks = []

uploaded_file = st.file_uploader("Upload a biotech research paper (PDF)", type="pdf")

if uploaded_file:
    with st.spinner("Extracting text from PDF..."):
        text = extract_text_from_pdf(uploaded_file)
        st.session_state.pdf_text = text

    with st.spinner("Summarizing using Groq..."):
        summary = summarize_text_with_groq(st.session_state.pdf_text)
        st.session_state.summary = summary
        st.session_state.top_chunks = [summary[i:i+1024] for i in range(0, len(summary), 1024)]

    st.subheader("📄 Summary")
    st.write(summary)

    st.subheader("❓ Ask a Question")
    user_question = st.text_input("Enter your question")
    if user_question:
        with st.spinner("Generating answer..."):
            answer = answer_question(user_question, st.session_state.top_chunks)
            st.markdown(f"**Answer:** {answer}")