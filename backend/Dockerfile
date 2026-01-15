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

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]