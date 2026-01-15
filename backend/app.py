import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf2image import convert_from_bytes
import pytesseract
import re

app = Flask(__name__)
# Allow requests from your frontend domains
CORS(app, resources={r"/*": {"origins": ["*"]}}, supports_credentials=False)

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
        
        # Get page count first
        from pdf2image.pdf2image import pdfinfo_from_bytes
        info = pdfinfo_from_bytes(pdf_bytes)
        page_count = info.get('Pages', 1)
        
        print(f"Processing {page_count} pages...")
        
        pages_text = []
        # Process pages ONE AT A TIME to minimize memory usage
        for page_num in range(1, page_count + 1):
            print(f"Processing page {page_num}/{page_count}")
            # Convert single page at a time with lower DPI
            images = convert_from_bytes(
                pdf_bytes, 
                dpi=150,  # Reduced from 200 to save memory
                first_page=page_num,
                last_page=page_num
            )
            
            # Process immediately and discard image
            if images:
                txt = pytesseract.image_to_string(images[0], lang=LANG)
                pages_text.append(txt)
                # Clear the image from memory
                del images
        
        print("OCR complete, parsing voters...")
        voters = parse_pages_text(pages_text)
        print(f"Extracted {len(voters)} voters")
        return jsonify(voters)
        
    except MemoryError:
        return jsonify({'error': 'PDF too large. Please try with fewer pages or smaller file.'}), 413
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))