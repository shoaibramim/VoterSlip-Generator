# Voter Slip Generator

A modern, bilingual (English/Bengali) web application for generating voter slips from PDF voter lists. Built with React, TypeScript, and Vite.

## Features

✅ **PDF Extraction** - Automatically extracts voter information from uploaded PDF files using spatial clustering algorithm
✅ **Bilingual Support** - Full UI translation between English and Bengali
✅ **Bengali Font** - Uses Kalpurush font from assets for proper Bengali text rendering
✅ **Smart Parsing** - Detects voter cards by clustering text spatially and validates data
✅ **Custom Templates** - Optional custom PDF templates with placeholder support
✅ **PDF Generation** - Creates voter slips in A4 or Legal paper size (2×2 grid layout)
✅ **Dark Mode** - Full dark mode support with smooth transitions
✅ **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend:** React 19.2.3 + TypeScript
- **Build Tool:** Vite 6.2.0
- **PDF Processing:** 
  - pdfjs-dist 5.4.530 (parsing)
  - pdf-lib 1.17.1 (generation)
  - @pdf-lib/fontkit 1.1.1 (Bengali font embedding)
- **Styling:** Tailwind CSS (CDN)
- **Icons:** lucide-react
- **Font:** Kalpurush (bundled in assets)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd VoterSlip-Generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Step 1: Upload Voter List
- Click to upload a PDF containing voter information
- The app scans all pages and extracts voter data using spatial clustering
- Only cards with both name and voter number are included

### Step 2: Add Center & Area Info (Optional)
- Enter vote center name (e.g., সোনাতলা হাই স্কুল)
- Enter voter area (e.g., ওয়ার্ড নং ৫)
- Both fields support Bengali text input

### Step 3: Custom Template (Optional)
- Upload a custom PDF template with placeholders like {{NAME}}, {{SERIAL}}, etc.
- Default template is used if no custom template is provided

### Step 4: Generate PDF
- Select paper size (A4 or Legal)
- Click "Generate Voter Slips"
- PDF downloads automatically with 4 voter cards per page (2×2 grid)

## Project Structure

```
VoterSlip-Generator/
├── assets/
│   └── kalpurush.ttf          # Bengali font
├── components/
│   ├── ui/
│   │   └── Toast.tsx          # Toast notification component
│   └── TemplateUploader.tsx   # Template upload component
├── i18n/
│   └── translations.ts        # English/Bengali translations
├── services/
│   ├── fontLoader.ts          # Font loading service
│   └── pdfProcessor.ts        # PDF parsing and generation
├── App.tsx                    # Main application component
├── types.ts                   # TypeScript type definitions
├── index.html                 # HTML entry point
├── index.tsx                  # React entry point
└── vite.config.ts            # Vite configuration
```

## Current Status

### Completed Features
- ✅ PDF extraction with spatial clustering algorithm
- ✅ All pages scanning (not limited to 5 pages)
- ✅ Bengali text detection and validation
- ✅ Bilingual UI (English ↔ Bengali)
- ✅ Kalpurush font integration for Bengali text
- ✅ Manual upload button for better UX
- ✅ Toast notifications (5-second duration with close button)
- ✅ Dark mode with theme toggle
- ✅ Custom template support
- ✅ Default template generation
- ✅ Vote center and area fields
- ✅ Sample data loader
- ✅ PDF generation with 2×2 grid layout

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
