# app/Dockerfile
FROM python:3.11-slim

# Install system deps and Node (for pa11y/npx)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node 18 (use NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pa11y

# Create app directory
WORKDIR /code

# Copy requirements and install
COPY ./app/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy application code
COPY ./app /code/app

ENV PYTHONPATH=/code

# Expose port
EXPOSE 8000

# Use uvicorn importing the app package
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
