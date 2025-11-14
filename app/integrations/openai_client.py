# app/integrations/openai_client.py - UPDATED FOR OPENAI v1.x
import os
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

# Initialize OpenAI client with v1.x syntax
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_recommendation_text(prompt: str) -> str:
    """
    Synchronous helper that returns a short recommendation string from OpenAI.
    Falls back to a friendly message on error.
    """
    try:
        # Check if API key is available
        if not os.getenv("OPENAI_API_KEY"):
            return "No recommendation available (OpenAI API key not configured)"
        
        # NEW v1.x syntax
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an accessibility expert."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
            temperature=0.35,
        )

        # NEW v1.x response structure
        if resp.choices and resp.choices[0].message.content:
            return resp.choices[0].message.content.strip()
        else:
            return "No recommendation generated"
            
    except Exception as e:
        return f"No recommendation available (error: {e})"