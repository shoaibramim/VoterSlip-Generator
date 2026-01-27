import gradio as gr
from pdf2image import convert_from_bytes
import pytesseract
import re
import json

# -------------------- CONFIG --------------------
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"
LANG = "ben+eng"
PSM = "--psm 6"

GARBAGE_TOKENS = [
    "ই ac", "হয়েছে", "oor", "Fae", "|", "||",
    "ফরম-", "ছবি ছাড়া", "চূড়ান্ত ভোটার", "ভোটার এলাকার",
    "ডাকঘর", "পোষ্টকোড"
]

# -------------------- UTILITIES --------------------
def clean_text(t):
    for g in GARBAGE_TOKENS:
        t = t.replace(g, "")
    return re.sub(r"\s+", " ", t).strip()

def is_page_number_line(line):
    """Detect standalone page numbers like: ১, ২৩, ৯৯"""
    return bool(re.fullmatch(r"[০-৯]{1,2}", line.strip()))

def split_row_by_field(row, field):
    return [x.strip() for x in row.split(field) if x.strip()]

# -------------------- VALIDATION --------------------
def is_valid(v):
    return bool(v["serial_no"] and v["voter_name_bn"] and v["voter_no_bd"])

# -------------------- MAIN PARSER --------------------
def parse_pages(pages):
    voters = []
    current = []

    for page in pages:
        lines = []
        for l in page.splitlines():
            l = clean_text(l)
            if not l:
                continue
            if is_page_number_line(l):
                continue
            lines.append(l)

        i = 0
        while i < len(lines):
            line = lines[i]

            # -------- NAME ROW --------
            if "নাম:" in line and re.search(r"[০-৯]+\. নাম:", line):
                voters.extend([v for v in current if is_valid(v)])
                current = []

                names = re.findall(r"([০-৯]+)\.\s*নাম:\s*([^০-৯]+)", line)
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
            if "ভোটার নং" in line:
                nums = re.findall(r"ভোটার নং[:\.]?\s*([০-৯ ]+)", line)
                for idx, v in enumerate(nums):
                    if idx < len(current):
                        current[idx]["voter_no_bd"] = v.replace(" ", "")
                i += 1
                continue

            # -------- FATHER --------
            if "পিতা:" in line:
                vals = split_row_by_field(line, "পিতা:")
                for idx, v in enumerate(vals):
                    if idx < len(current):
                        current[idx]["father_name_bn"] = v
                i += 1
                continue

            # -------- MOTHER --------
            if "মাতা:" in line:
                vals = split_row_by_field(line, "মাতা:")
                for idx, v in enumerate(vals):
                    if idx < len(current):
                        current[idx]["mother_name_bn"] = v
                i += 1
                continue

            # -------- PROFESSION + DOB --------
            DATE_PATTERN = r"[০-৯]{2}/[০-৯]{2}/[০-৯]{4}"

            if "পেশা:" in line:
                parts = split_row_by_field(line, "পেশা:")

                for idx, p in enumerate(parts):
                    if idx >= len(current):
                        continue

                    date_match = re.search(DATE_PATTERN, p)
                    if date_match:
                        current[idx]["date_of_birth_bn"] = date_match.group()
                        p = re.sub(r"(জন্ম\s*)?তারিখ[:：]?\s*" + DATE_PATTERN, "", p)

                    profession = p.strip(" ,।")
                    current[idx]["profession_bn"] = profession if profession else "N/A"

                i += 1
                continue

            # -------- ADDRESS --------
            if "ঠিকানা:" in line:
                addr_line = line
                if i + 1 < len(lines) and not re.search(r"[০-৯]+\. নাম:", lines[i + 1]):
                    if "ঠিকানা:" not in lines[i + 1]:
                        addr_line += " " + lines[i + 1]
                        i += 1

                addr_parts = split_row_by_field(addr_line, "ঠিকানা:")
                for idx, a in enumerate(addr_parts):
                    if idx < len(current):
                        current[idx]["address_bn"] = a.strip(", ")
                i += 1
                continue

            i += 1

    voters.extend([v for v in current if is_valid(v)])
    return voters

# -------------------- GRADIO FUNCTION --------------------
def extract_voters(pdf_file):
    """Extract voters from uploaded PDF file"""
    if pdf_file is None:
        return {"error": "No file uploaded"}
    
    try:
        print(f"Received file: {type(pdf_file)}")
        print(f"File path: {pdf_file if isinstance(pdf_file, str) else getattr(pdf_file, 'name', 'unknown')}")
        
        # Handle both filepath string and file object
        if isinstance(pdf_file, str):
            # It's a file path
            file_path = pdf_file
        elif hasattr(pdf_file, 'name'):
            # It's a file object with .name attribute
            file_path = pdf_file.name
        else:
            return {"error": "Invalid file object"}
        
        # Read the PDF file
        with open(file_path, 'rb') as f:
            pdf_bytes = f.read()
        
        print(f"PDF size: {len(pdf_bytes)} bytes")
        
        # Get page count
        from pdf2image.pdf2image import pdfinfo_from_bytes
        info = pdfinfo_from_bytes(pdf_bytes)
        page_count = info.get('Pages', 1)
        
        print(f"📄 Processing {page_count} pages...")
        
        # Convert PDF to images and OCR
        pages_text = []
        for page_num in range(1, page_count + 1):
            print(f"  → Page {page_num}/{page_count}")
            images = convert_from_bytes(
                pdf_bytes, 
                dpi=300,
                first_page=page_num,
                last_page=page_num
            )
            
            if images:
                txt = pytesseract.image_to_string(images[0], lang=LANG, config=PSM)
                pages_text.append(txt)
                del images
        
        print("🔍 Parsing voter data...")
        voters = parse_pages(pages_text)
        print(f"✅ Extracted {len(voters)} valid voters")
        
        return voters
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# -------------------- GRADIO INTERFACE --------------------
# Remove file_types restriction to allow API uploads
demo = gr.Interface(
    fn=extract_voters,
    inputs=gr.File(label="📄 Upload PDF File"),
    outputs=gr.JSON(label="📋 Extracted Voter Data"),
    title="🗳️ VoterSlip Generator - Bengali OCR",
    description="""
    Upload a PDF file containing Bengali voter information to extract structured data.
    
    **Extracts:** Name, Voter Number, Father's Name, Mother's Name, Date of Birth, Profession, Address
    """,
    examples=[],
    api_name="predict"
)

if __name__ == "__main__":
    demo.launch()
