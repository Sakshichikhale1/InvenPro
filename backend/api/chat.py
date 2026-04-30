from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    inventory_context: dict

@router.post("/message")
async def chat_message(request: ChatRequest):
    groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is not set in the backend.")
        
    try:
        client = OpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        
        # We summarize the context to avoid hitting token limits
        context_str = json.dumps(request.inventory_context, default=str)
        if len(context_str) > 10000:
            context_str = context_str[:10000] + "... (truncated)"
        
        system_prompt = f"""You are an AI inventory assistant powered by Grok for a smart stock keeping application.
You help the user manage their inventory, analyze profits, track GST, and provide insights.
Here is the current inventory context data (in JSON format):
{context_str}

Answer the user's question accurately based on this data. Use Markdown for formatting (bold text, lists, etc). Keep your answers concise and directly answer the question."""
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
        )
        
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        print(f"Error calling Grok API: {e}")
        raise HTTPException(status_code=500, detail=str(e))
