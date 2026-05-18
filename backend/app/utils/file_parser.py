import pandas as pd
from PyPDF2 import PdfReader
import io

def parse_csv(file_bytes: bytes) -> str:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        # Provide a structural summary and string representation
        summary = f"CSV Data Summary:\nRows: {len(df)}, Columns: {len(df.columns)}\n"
        summary += f"Columns: {', '.join(df.columns)}\n"
        # Include first 100 rows to avoid too much text
        data_sample = df.head(100).to_string(index=False)
        return summary + "\nData Sample:\n" + data_sample
    except Exception as e:
        return f"Failed to parse CSV: {str(e)}"

def parse_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Failed to parse PDF: {str(e)}"

def extract_file_content(filename: str, content_type: str, file_bytes: bytes) -> str:
    if filename.endswith(".csv") or "csv" in content_type:
        return parse_csv(file_bytes)
    elif filename.endswith(".pdf") or "pdf" in content_type:
        return parse_pdf(file_bytes)
    elif "image" in content_type:
        return "[IMAGE_UPLOADED] (Image parsing should be handled by Gemini Vision API directly)"
    else:
        # Fallback to text
        try:
            return file_bytes.decode('utf-8')
        except:
            return "Unsupported file format."
