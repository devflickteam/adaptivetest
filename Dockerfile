# Dockerfile - Minimal working version
FROM python:3.11-slim

WORKDIR /code

# Copy requirements and install Python dependencies
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Install Playwright and Chromium (skip install-deps)
RUN pip install playwright==1.40.0
RUN playwright install chromium

# Copy application code
COPY app /code/app

ENV PYTHONPATH=/code

# Expose port
EXPOSE 8000

# Use uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]