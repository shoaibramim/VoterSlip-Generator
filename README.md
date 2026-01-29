# Voter Slip Generator

<div align="center">

![Banner](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF?style=for-the-badge)

**A modern, bilingual (English/Bengali) web application for generating voter slips from PDF voter lists using AI-powered text extraction.**

[Live Demo](https://voter-slip-generator.vercel.app/) • [Backend API](https://huggingface.co/spaces/shoaibramim/voterslip-backend) • [Report Bug](mailto:shoaibu.ramim@gmail.com)

</div>

---

## Overview

This application automates the process of extracting voter information from structured PDF documents and generating formatted voter slips. The system combines **YOLOv8n object detection** with **Tesseract OCR** to achieve high accuracy in text extraction, then uses **pdf-lib** to generate beautifully formatted voter slips with Bengali font support.

### Key Highlights

- **AI-Powered Extraction**: Custom-trained YOLOv8n model for box detection + Tesseract OCR for text extraction
- **High Accuracy**: 99.5% mAP50, 99.9% Precision, 100% Recall on box detection
- **Bilingual Interface**: Full support for English and Bengali languages
- **Custom Templates**: Upload custom slip designs with configurable aspect ratios (1:1 or 3:4)
- **Multiple Export Options**: A4 and Legal paper sizes with automatic grid layout
- **JSON Import/Export**: Test different designs without re-processing PDFs

---

## Architecture

### System Flow

```
┌─────────────────┐
│  PDF Upload     │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend API (HuggingFace)      │
│  ┌──────────────────────────┐   │
│  │ 1. Convert PDF to Images │   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 2. YOLOv8n Box Detection │   │
│  │    (99.5% mAP50)         │   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 3. Tesseract OCR         │   │
│  │    (Bengali + English)   │   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 4. Parse & Structure     │   │
│  │    Voter Data            │   │
│  └──────────┬───────────────┘   │
└─────────────┼───────────────────┘
              │ JSON Response
              ▼
┌─────────────────────────────────┐
│  Frontend (Vercel)              │
│  ┌──────────────────────────┐   │
│  │ 1. Display Extracted Data│   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 2. Apply Custom Template │   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 3. Generate PDF with     │   │
│  │    pdf-lib + Kalpurush   │   │
│  └──────────┬───────────────┘   │
│             ▼                    │
│  ┌──────────────────────────┐   │
│  │ 4. Download Voter Slips  │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

---

## YOLOv8n Model Training

### The Challenge

Initially, using **Tesseract OCR alone** on voter list PDFs resulted in poor accuracy due to:
- Complex layouts with multiple voter cards per page
- Varying text orientations and sizes
- No clear boundaries between voter entries

### The Solution: Custom YOLOv8n Object Detection

I trained a **YOLOv8n model** to detect rectangular boxes containing voter information before applying OCR. This two-step approach significantly improved accuracy.

#### Training Process

1. **Dataset Preparation**
   - Annotated **38 pages** from sample voter list PDFs
   - Used **Roboflow** for annotation and augmentation
   - Labeled rectangular boxes containing voter information
   - Total annotations: ~650+ bounding boxes

2. **Model Training**
   - Base Model: **YOLOv8n** (nano - optimized for speed)
   - Framework: **Ultralytics**
   - Platform: **Google Colab** (GPU: T4)
   - Training notebook: [`Train_YOLOv8n_for_Box_Detection.ipynb`](backend/Train_YOLOv8n_for_Box_Detection.ipynb)

3. **Model Performance**
   ```
   Metric          Value
   ─────────────────────
   mAP50           99.5%
   mAP50-95        99.4%
   Precision       99.9%
   Recall         100.0%
   ```

4. **Model Deployment**
   - Exported formats: `best.pt` (PyTorch) and `best.onnx` (ONNX)
   - Uploaded to HuggingFace Spaces repository
   - Runs on CPU (free tier compatible)

---

## Tech Stack

### Frontend (Vercel)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI framework |
| **TypeScript** | 5.8.2 | Type safety |
| **Vite** | 6.2.0 | Build tool & dev server |
| **pdf-lib** | 1.17.1 | PDF generation |
| **@pdf-lib/fontkit** | 1.1.1 | Bengali font embedding |
| **@gradio/client** | 2.0.2 | Backend API communication |
| **lucide-react** | 0.562.0 | Icons |
| **Tailwind CSS** | CDN | Styling |

### Backend (HuggingFace Spaces)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11 | Runtime |
| **Gradio** | Latest | API framework |
| **YOLOv8 (Ultralytics)** | Latest | Box detection model |
| **Tesseract OCR** | 5.x | Text extraction (Bengali + English) |
| **OpenCV** | Latest | Image preprocessing |
| **pdf2image** | Latest | PDF to image conversion |
| **PyTorch** | Latest | YOLO model inference |

### Assets

- **Font**: [Kalpurush.ttf](public/kalpurush.ttf) - Bengali Unicode font
- **Model**: `best.pt` & `best.onnx` - Custom YOLOv8n weights

---

## Features

### User Interface

-  **Bilingual Support**: Switch between English (EN) and Bengali (বাং) seamlessly
-  **Dark Mode**: Full dark theme with smooth transitions
-  **Responsive Design**: Mobile-first design, works on all screen sizes
-  **Mobile Menu**: Collapsible navigation for mobile devices
-  **Toast Notifications**: Real-time feedback for all operations

### Data Input

-  **PDF Upload**: Drag-and-drop or click to upload voter list PDFs
-  **JSON Upload**: Import pre-extracted data for design testing
-  **Sample Data**: Load mock data for quick testing
-  **JSON Export**: Download extracted data for reuse

### Data Extraction

-  **AI-Powered**: YOLOv8n + Tesseract OCR pipeline
-  **Backend Processing**: Processing happens on HuggingFace Spaces (no local computation)
-  **Progress Tracking**: Real-time timer showing processing duration
-  **Data Preview**: View extracted voter information before generating slips

### Template System

-  **Custom Templates**: Upload JPG, PNG, or PDF templates
-  **Aspect Ratios**: Support for 1:1 (square) and 3:4 (portrait) formats
-  **Default Template**: Grey background when no custom template is provided
-  **Fixed Box Layout**: Consistent positioning (40% header, 15% box1, 35% box2)

### Slip Generation

-  **Bengali Font Rendering**: Proper Kalpurush font embedding with subset support
-  **Multi-line Text Wrapping**: Automatic line breaks for long addresses
-  **Rounded Corners**: 6px radius boxes with transparent borders
-  **Grid Layout**: 
  - 1:1 aspect ratio: 6 slips per page (2×3 grid)
  - 3:4 aspect ratio: 4 slips per page (2×2 grid)
-  **Paper Sizes**: A4 (595×842 pt) and Legal (612×1008 pt)

### Slip Information

Each slip contains:
- **Box 1**: Vote center (কেন্দ্র) + Voter area (এলাকা) - Optional
- **Box 2**: 
  - Serial number + Name (নাম)
  - Voter number (ভোটার নং)
  - Father's name (পিতা)
  - Mother's name (মাতা)
  - Profession (পেশা) + Date of birth (জন্ম তারিখ)
  - Address (ঠিকানা) - up to 2 lines

### Communication

- **Contact Developer**: Built-in contact form
- **FormSubmit Integration**: Messages sent directly to developer email
- **Validation**: Email format and message length validation

---

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/shoaibramim/VoterSlip-Generator.git
   cd VoterSlip-Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` in the root directory:
   ```env
   VITE_API_URL=shoaibramim/voterslip-backend  # Or link to your backend repository.
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173 or http://localhost:6000
   ```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder, ready for deployment.

---

## Usage Guide

### Step 1: Upload Voter List

**Option A: PDF Upload**
1. Click the upload area or drag a PDF file
2. Click "Upload & Process" button
3. Wait for backend processing (OCR extraction)
4. View extracted data in the preview panel

**Option B: JSON Upload**
1. Click "Upload JSON" button
2. Select a JSON file with voter data
3. Data appears immediately in preview

**Option C: Sample Data**
1. Click "Load Sample Data"
2. Pre-filled data loads instantly

### Step 2: Add Center & Area Info (Optional)

- **Vote Center**: e.g., `কাউয়ারখোপ হাকিম রকিমা উচ্চ বিদ্যালয়`
- **Voter Area**: e.g., `ওয়ার্ড নং ৫`

These fields appear in Box 1 of each slip.

### Step 3: Upload Custom Template (Optional)

1. Select aspect ratio: **Square (1:1)** or **Portrait (3:4)**
2. Click "Click to Upload Template"
3. Choose JPG, PNG, or PDF file
4. Template preview shows "Custom Template Active"

> **Note**: Without a custom template, slips use a grey default background.

### Step 4: Choose Paper Size

- **A4**: Standard international size
- **Legal**: US legal paper size

### Step 5: Generate Voter Slips

1. Click "**Generate Voter Slips**" button
2. PDF generates with proper Bengali font
3. File downloads automatically
4. Filename format: `voter_slips_A4.pdf`

---

## Project Structure

```
VoterSlip-Generator/
│
├── backend/                              # Backend code (HuggingFace Spaces)
│   ├── app.py                           # Flask + Gradio API
│   ├── requirements.txt                 # Python dependencies
│   ├── packages.txt                     # System packages (Tesseract)
│   ├── README_HF.md                     # HuggingFace README
│   └── Train_YOLOv8n_for_Box_Detection.ipynb  # Model training notebook
│
├── components/                           # React components
│   ├── ui/
│   │   └── Toast.tsx                    # Toast notification component
│   ├── TemplateUploader.tsx             # Template upload component
│   └── ContactDeveloper.tsx             # Contact form page
│
├── i18n/
│   └── translations.ts                  # English/Bengali translations
│
├── services/
│   ├── fontLoader.ts                    # Kalpurush font loader
│   └── pdfProcessor.ts                  # PDF extraction & generation logic
│
├── public/
│   └── kalpurush.ttf                    # Bengali Unicode font
│
├── App.tsx                              # Main application component
├── types.ts                             # TypeScript type definitions
├── index.tsx                            # React entry point
├── index.html                           # HTML template
├── vite.config.ts                       # Vite configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # NPM dependencies & scripts
└── README.md                            # This file
```

---

## Testing

### Manual Testing Checklist

**Frontend:**
- [ ] PDF upload and processing
- [ ] JSON upload and validation
- [ ] Sample data loading
- [ ] JSON export/download
- [ ] Language switching (EN ↔ BN)
- [ ] Dark mode toggle
- [ ] Mobile menu functionality
- [ ] Contact form submission
- [ ] Custom template upload (JPG, PNG, PDF)
- [ ] Aspect ratio switching (1:1, 3:4)
- [ ] Paper size selection (A4, Legal)
- [ ] PDF generation with Bengali font
- [ ] Responsive design on mobile/tablet/desktop

**Backend:**
- [ ] PDF to image conversion
- [ ] YOLOv8n box detection
- [ ] Tesseract OCR extraction
- [ ] Data parsing and structuring
- [ ] JSON response format

---

## Deployment

### Frontend (Vercel)

**Live URL**: [https://voter-slip-generator.vercel.app/](https://voter-slip-generator.vercel.app/)

**Deployment Steps:**
1. Connect GitHub repository to Vercel
2. Set environment variable: `VITE_API_URL`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy automatically on every push to `main`

### Backend (HuggingFace Spaces)

**Live URL**: [https://huggingface.co/spaces/shoaibramim/voterslip-backend](https://huggingface.co/spaces/shoaibramim/voterslip-backend)

**Files Required:**
- `app.py` - Main API code
- `requirements.txt` - Python dependencies
- `packages.txt` - System packages (Tesseract)
- `best.pt` - YOLOv8n model weights
- `best.onnx` - ONNX model (optional)

**Configuration:**
- SDK: **Gradio**
- Python: **3.11**
- Hardware: **CPU Basic** (free tier)

---

## Performance Metrics

### Model Performance

| Metric | Value | Description |
|--------|-------|-------------|
| **mAP50** | 99.5% | Mean Average Precision at IoU=0.5 |
| **mAP50-95** | 99.4% | Mean Average Precision at IoU=0.5-0.95 |
| **Precision** | 99.9% | True Positive / (True Positive + False Positive) |
| **Recall** | 100.0% | True Positive / (True Positive + False Negative) |

---

## Data Privacy

- **No Data Storage**: Uploaded PDFs are processed and discarded immediately
- **Client-side Generation**: Voter slips are generated in the browser using pdf-lib
- **Temporary Processing**: Backend processes data in memory only
- **No Tracking**: No analytics or user tracking implemented

---

## Known Issues & Limitations

1. **OCR Accuracy**: Depends on PDF quality and scan resolution
2. **Box Detection**: Requires PDFs with rectangular box layouts
3. **Processing Time**: Backend can take longer (e.g., 10+ minutes) for large PDFs (HuggingFace free tier)
4. **Font Rendering**: Requires proper Bengali font (Kalpurush) in public folder
5. **Mobile Upload**: Large PDF uploads may be slow on mobile networks

---

## Future Enhancements

- [ ] Improve Bengali text extraction accuracy by fine-tuning and training Tesseract OCR on appropriate dataset.
- [ ] Support for more PDF layouts (non-boxed)
- [ ] QR code generation for each slip

---

## Developer

**Shoaib Uddin**  
 Email: [shoaibu.ramim@gmail.com](mailto:shoaibu.ramim@gmail.com)  
 GitHub: [@shoaibramim](https://github.com/shoaibramim)  
 Portfolio: [Coming Soon]

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- **Tesseract OCR** - Open-source OCR engine
- **Ultralytics YOLOv8** - State-of-the-art object detection
- **Roboflow** - Dataset annotation platform
- **HuggingFace Spaces** - Free model hosting
- **Vercel** - Frontend deployment platform
- **Kalpurush Font** - Bengali Unicode font

---

## Support

If you encounter any issues or have questions:

1. **Contact Form**: Use the in-app contact developer page
2. **Email**: [shoaibu.ramim@gmail.com](mailto:shoaibu.ramim@gmail.com)
3. **GitHub Issues**: [Create an issue](https://github.com/shoaibramim/VoterSlip-Generator/issues)

---

<div align="center">

⭐ Star this repo if you find it helpful!

</div>
