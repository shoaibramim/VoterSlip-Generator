FROM python:3.9-slim

# Install system dependencies including Tesseract and Bengali language pack
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ben \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run with Gunicorn with optimized settings for low memory
# --workers=1: Single worker to minimize memory usage
# --threads=2: Use threads instead of multiple workers
# --timeout=300: 5 min timeout for OCR processing
# --max-requests=100: Restart worker after 100 requests to prevent memory leaks
# --max-requests-jitter=10: Add randomness to prevent all workers restarting simultaneously
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--workers=1", "--threads=2", "--timeout=300", "--max-requests=100", "--max-requests-jitter=10", "--worker-class=sync", "app:app"]