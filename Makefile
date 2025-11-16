# Variables
REQ_TXT=requirements.txt
REQ_LOCK=requirements.lock

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make lock       - Regenerate requirements.lock from requirements.txt"
	@echo "  make sync-check - Verify requirements.txt and requirements.lock are in sync"
	@echo "  make build      - Build backend Docker image"
	@echo "  make up         - Start services with docker-compose"
	@echo "  make down       - Stop services"

# Generate a new lockfile (update dependencies)
.PHONY: lock
lock:
	pip-compile --quiet --generate-hashes --allow-unsafe --output-file $(REQ_LOCK) $(REQ_TXT)

# Check if requirements.txt and requirements.lock are in sync
.PHONY: sync-check
sync-check:
	pip-compile --quiet --generate-hashes --allow-unsafe --output-file tmp.lock $(REQ_TXT)
	@if ! diff -u tmp.lock $(REQ_LOCK) >/dev/null; then \
		echo "❌ requirements.txt and requirements.lock are out of sync!"; \
		echo "   Run 'make lock' to regenerate."; \
		rm -f tmp.lock; \
		exit 1; \
	fi
	@rm -f tmp.lock
	@echo "✅ requirements.txt and requirements.lock are in sync."

# Build backend Docker image (enforces sync inside container too)
.PHONY: build
build:
	docker-compose build

# Bring services up
.PHONY: up
up:
	docker-compose up

# Bring services down
.PHONY: down
down:
	docker-compose down
