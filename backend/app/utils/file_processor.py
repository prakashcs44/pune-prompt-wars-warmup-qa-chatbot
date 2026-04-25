import base64
import io
import pandas as pd
from pypdf import PdfReader
from typing import List

def extract_text_from_file(filename: str, base64_content: str) -> str:
    """
    Extracts text from various file formats given their Base64 content.
    Supports: .txt, .csv, .pdf, .md
    """
    try:
        # Decode base64
        file_bytes = base64.b64decode(base64_content)
        file_io = io.BytesIO(file_bytes)
        
        ext = filename.lower().split('.')[-1]
        
        if ext == 'pdf':
            reader = PdfReader(file_io)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
            
        elif ext == 'csv':
            df = pd.read_csv(file_io)
            # Return first 50 rows as a markdown table to save tokens
            return df.head(50).to_markdown()
            
        elif ext in ['txt', 'md', 'py', 'js', 'json']:
            return file_bytes.decode('utf-8', errors='replace')
            
        else:
            # Fallback to plain text decode
            return file_bytes.decode('utf-8', errors='replace')
            
    except Exception as e:
        return f"[Error parsing {filename}: {str(e)}]"
