import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key = os.getenv("GOOGLE_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def generate_answer(context, question):
    try:
        prompt = f"""You are a StreamKar assitant chatbot, answer only using this context:
        {context}

        Question:
        {question}

        if unsure, just say:
            Sorry, I do not have knowledge about your query.
        """

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        return f"Error: {str(e)}"
        

