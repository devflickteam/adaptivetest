import os
import openai

# Make sure your OpenAI API key is in the environment
openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_recommendation(rule_code: str, description: str) -> str:
    """
    Uses OpenAI to generate an accessibility fix recommendation
    for a given rule_code and issue description.
    """
    prompt = (
        f"Accessibility issue detected:\n"
        f"Rule: {rule_code}\n"
        f"Description: {description}\n\n"
        "Provide a concise recommendation (1–2 sentences) "
        "for fixing this issue in plain English."
    )

    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an accessibility expert."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
            temperature=0.4,
        )

        return response.choices[0].message["content"].strip()

    except Exception as e:
        # If OpenAI API call fails, return a fallback message
        return f"No recommendation available (error: {str(e)})"
