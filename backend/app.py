import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf2image import convert_from_bytes
import pytesseract
import re

app = Flask(__name__)
# Allow requests from your Vercel domain (or * for testing)
CORS(app)

# Tesseract configuration
# In Docker, tesseract is usually at /usr/bin/tesseract
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"
LANG = "ben+eng"

GARBAGE_TOKENS = [
    "ই ac", "হয়েছে", "oor", "Fae", "|", "||",
    "ফরম-", "ছবি ছাড়া", "চূড়ান্ত ভোটার", "ভোটার এলাকার",
    "ডাকঘর", "পোষ্টকোড"
]

def clean_text(t):
    for g in GARBAGE_TOKENS:
        t = t.replace(g, "")
    return re.sub(r"\s+", " ", t).strip()

def parse_pages_text(pages_text):
    voters = []
    current = []

    for page in pages_text:
        lines = []
        for l in page.splitlines():
            l = clean_text(l)
            if not l: continue
            if re.fullmatch(r"[০-৯]{1,2}", l.strip()): continue 
            lines.append(l)

        i = 0
        while i < len(lines):
            line = lines[i]

            # -------- NAME ROW --------
            if "নাম:" in line:
                # Flush previous if it exists and has voter no
                if current:
                    for v in current:
                        if v.get("voter_no_bd"):
                            # Logic to ensure complete data
                            voters.append(v)
                    current = []
                
                # Regex to find names in the row
                names = re.findall(r"([০-৯]+)\.\s*নাম:\s*([^০-৯]+)", line)
                if names:
                    for serial, name in names:
                        current.append({
                            "id": f"voter_{serial}",
                            "serial_no": serial,
                            "voter_name_bn": name.strip(" ।"),
                            "voter_no_bd": None,
                            "father_name_bn": "N/A",
                            "mother_name_bn": "N/A",
                            "profession_bn": "N/A",
                            "date_of_birth_bn": "N/A",
                            "address_bn": "N/A"
                        })
                i += 1
                continue

            # -------- VOTER NO --------
            if "ভোটার নং" in line and current:
                nums = re.findall(r"ভোটার নং[:\.]?\s*([০-৯ ]+)", line)
                for idx, v in enumerate(nums):
                    if idx < len(current):
                        current[idx]["voter_no_bd"] = v.replace(" ", "")
                i += 1
                continue
            
            # ... (Add rest of your Python logic here: Father, Mother, Date, etc.) ...
            
            i += 1
            
    # Add lingering voters from last page
    for v in current:
        if v.get("voter_no_bd"):
             voters.append(v)
             
    return voters

@app.route('/extract', methods=['POST'])
def extract_voters():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Read file to bytes
        pdf_bytes = file.read()
        
        # Convert to Images
        images = convert_from_bytes(pdf_bytes, dpi=200) # Lower DPI to save RAM on free tier
        
        pages_text = []
        for img in images:
            txt = pytesseract.image_to_string(img, lang=LANG)
            pages_text.append(txt)

        voters = parse_pages_text(pages_text)
        return jsonify(voters)
        
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))