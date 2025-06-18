import streamlit as st
import requests


try:
    r = requests.get("http://localhost:8000")
    if r.status_code == 200:
        st.success("FastAPI backend is UP ✅")
    else:
        st.warning(f"Backend responded with status: {r.status_code}")
except Exception as e:
    st.error(f"FastAPI backend is NOT reachable ❌: {e}")


uploaded_file = st.file_uploader("Upload your PDF", type="pdf")

if uploaded_file is not None:
    if st.button("Upload"):
        files = {"file": (uploaded_file.name, uploaded_file, "application/pdf")}

        try:
            response = requests.post("http://localhost:8000/upload/", files=files)
            st.write("Status code:", response.status_code)
            # st.write("Raw response:", response.text)

            if response.status_code == 200:
                st.success("Summary: " + response.json()["summary"])
            else:
                st.error("Something went wrong. Check backend logs.")

        except requests.exceptions.RequestException as e:
            st.error(f"Connection error: {e}")
