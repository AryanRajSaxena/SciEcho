import pdfplumber

def extract_text_from_pdf(file_like_obj):
    with pdfplumber.open(file_like_obj) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text
