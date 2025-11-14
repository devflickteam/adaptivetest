# Adaptivetest Backend (FastAPI) - PACKAGE

## Overview
FastAPI backend that crawls a website (internal pages only, up to 30 pages), extracts metadata (image URLs + alt text),
checks accessibility issues (title, h1, missing alt, ARIA), evaluates color contrast using Pillow, performs strict broken link checking,
runs synchronous OpenAI analysis, and stores results in SQLite. Docker-ready.

## Run (local)
1. Replace the API key inside .env with your current key (or leave as-is to test).
2. Build and run with docker-compose:
   ```bash
   docker-compose up --build
   ```
3. Test with the provided Python test script:
   ```bash
   python test_request.py
   ```
