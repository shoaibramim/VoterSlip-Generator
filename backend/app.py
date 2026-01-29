import gradio as gr
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
import re
import json
import torch

# -------------------- CONFIGURATION --------------------

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

# Load YOLOv8 model (upload best.pt to HuggingFace repo)
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)

# Set to CPU mode for HuggingFace free tier
model.to('cpu')

CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45

# -------------------- HELPER FUNCTIONS --------------------

def filter_similar_boxes(boxes, tolerance=0.15):
    '''Filter boxes to keep only similar sized ones'''
    if len(boxes) == 0:
        return boxes
    
    # Calculate areas
    areas = [(box[2] - box[0]) * (box[3] - box[1]) for box in boxes]
    median_area = np.median(areas)
    
    # Keep boxes within tolerance of median area
    filtered = []
    for box, area in zip(boxes, areas):
        if abs(area - median_area) / median_area <= tolerance:
            filtered.append(box)
    
    return filtered

def extract_text_from_crop(crop_img):
    '''Extract Bengali text using Tesseract'''
    # Preprocess
    gray = cv2.cvtColor(crop_img, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # OCR
    text = pytesseract.image_to_string(binary, lang='ben+eng', config='--psm 6')
    return text

def parse_voter_info(text):
    """
    Parse structured voter information from OCR text
    """
    
    voter = {
        "id": "",
        "serial_no": "",
        "voter_name_bn": "",
        "voter_no_bd": "",
        "father_name_bn": "N/A",
        "mother_name_bn": "N/A",
        "profession_bn": "N/A",
        "date_of_birth_bn": "N/A",
        "address_bn": "N/A"
    }
    
    # Serial number
    serial_match = re.search(r'([০-৯\d]+)\.\s*নাম[:：]', text)
    if serial_match:
        serial = serial_match.group(1)
        voter['serial_no'] = serial
        voter['id'] = f"voter_{serial}"
    
    # Voter name
    name_match = re.search(r'নাম[:：]\s*(.+?)(?=\n|ভোটার|$)', text)
    if name_match:
        voter['voter_name_bn'] = name_match.group(1).strip(' ।.,')
    
    # Voter number (10-15 digits)
    voter_no_match = re.search(r'ভোটার\s*নং[:：\.]?\s*([০-৯\d\s]{10,})', text)
    if voter_no_match:
        voter_no = voter_no_match.group(1).replace(' ', '')
        voter['voter_no_bd'] = voter_no
    
    # Father's name
    father_match = re.search(r'পিতা[:：]\s*(.+?)(?=\n|মাতা|$)', text)
    if father_match:
        voter['father_name_bn'] = father_match.group(1).strip(' ।.,')
    
    # Mother's name
    mother_match = re.search(r'মাতা[:：]\s*(.+?)(?=\n|পেশা|ভোটার|$)', text)
    if mother_match:
        voter['mother_name_bn'] = mother_match.group(1).strip(' ।.,')
    
    # Profession
    prof_match = re.search(r'পেশা[:：]\s*(.+?)(?=,|জন্ম|তারিখ|\n|$)', text)
    if prof_match:
        voter['profession_bn'] = prof_match.group(1).strip(' .,')
    
    # Date of birth (DD/MM/YYYY format)
    dob_match = re.search(r'তারিখ[:：]?\s*([০-৯\d]{1,2}[\/\-][০-৯\d]{1,2}[\/\-][০-৯\d]{4})', text)
    if dob_match:
        voter['date_of_birth_bn'] = dob_match.group(1)
    
    # Address
    addr_match = re.search(r'ঠিকানা[:：]\s*(.+?)(?=$)', text, re.DOTALL)
    if addr_match:
        address = addr_match.group(1).strip()
        address = re.sub(r'\s+', ' ', address)
        address = address.strip(' .,')
        voter['address_bn'] = address
    
    return voter

def is_valid_voter(voter):
    '''Check if voter has minimum required fields'''
    return bool(voter['voter_name_bn'] and voter['voter_no_bd'] and len(voter['voter_no_bd']) >= 10)

# -------------------- MAIN PROCESSING --------------------

def process_pdf(pdf_file):
    '''Main processing pipeline'''
    if pdf_file is None:
        return {"error": "No file uploaded"}
    
    try:
        # Read PDF
        with open(pdf_file.name if hasattr(pdf_file, 'name') else pdf_file, 'rb') as f:
            pdf_bytes = f.read()
        
        print("Converting PDF to images...")
        images = convert_from_bytes(pdf_bytes, dpi=300)
        
        all_voters = []
        total_boxes = 0
        
        for page_num, page_img in enumerate(images, 1):
            print(f"Processing page {page_num}/{len(images)}...")
            
            # Convert PIL to numpy
            img_array = np.array(page_img)
            
            # Detect voter cards with YOLO
            results = model.predict(
                img_array,
                conf=CONF_THRESHOLD,
                iou=IOU_THRESHOLD,
                verbose=False
            )
            
            if len(results) == 0 or len(results[0].boxes) == 0:
                print(f"  No voter cards detected on page {page_num}")
                continue
            
            # Get bounding boxes
            boxes = results[0].boxes.xyxy.cpu().numpy()
            
            # Filter to similar-sized boxes only
            filtered_boxes = filter_similar_boxes(boxes)
            
            print(f"  Detected {len(filtered_boxes)} voter cards")
            total_boxes += len(filtered_boxes)
            
            # Process each detected box
            for box_idx, box in enumerate(filtered_boxes):
                x1, y1, x2, y2 = map(int, box)
                
                # Crop voter card
                crop = img_array[y1:y2, x1:x2]
                
                # Extract text
                text = extract_text_from_crop(crop)
                
                # Parse voter info
                voter_info = parse_voter_info(text)
                
                # Add if valid
                if is_valid_voter(voter_info):
                    all_voters.append(voter_info)
                    print(f"    ✓ Box {box_idx+1}: {voter_info['voter_name_bn']}")
        
        print(f"\n✓ Total boxes detected: {total_boxes}")
        print(f"✓ Valid voters extracted: {len(all_voters)}")
        
        return all_voters
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# -------------------- GRADIO INTERFACE --------------------

demo = gr.Interface(
    fn=process_pdf,
    inputs=gr.File(label="📄 Upload Voter Card PDF"),
    outputs=gr.JSON(label="📋 Extracted Voter Data"),
    title="🗳️ YOLOv8 + Tesseract Voter Card Extractor",
    description='''
    **Advanced Pipeline:**
    1. 🎯 YOLOv8n detects voter card boxes
    2. ✂️ Filters uniform-sized boxes only
    3. 🔍 Tesseract OCR extracts Bengali text
    4. 📊 Parses structured voter information
    
    **Handles:** Multi-column layouts, varying page structures
    ''',
    api_name="predict"
)

if __name__ == "__main__":
    demo.launch()