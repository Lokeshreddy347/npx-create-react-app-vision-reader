import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# SETUP GEMINI (Replace 'YOUR_API_KEY' with your actual key from AI Studio)
genai.configure(api_key="AIzaSyCkqEvQrv6i4_857jjLqN64LPVGwfYenyU")
model = genai.GenerativeModel('gemini-1.5-flash')

class TranslationRequest(BaseModel):
    text: str
    dest: str

LANGUAGE_MAP = {
    "telugu": "te", "hindi": "hi", "tamil": "ta", "kannada": "kn",
    "malayalam": "ml", "marathi": "mr", "gujarati": "gu", "punjabi": "pa",
    "bengali": "bn", "english": "en"
}

@app.post("/translate")
class TranslationRequest(BaseModel):
    text: str
    dest: str
    mode: str = "translate" # Default is translate

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    try:
        if request.mode == "summary":
            prompt = f"Explain the following text in {request.dest} in just 2 or 3 very simple sentences as if explaining to a child or elderly person. Focus only on the most important information: {request.text}"
        else:
            prompt = f"Translate the following text into {request.dest} accurately while keeping the tone helpful: {request.text}"
        
        response = model.generate_content(prompt)
        return {"translated_text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-language")
async def parse_language(request: TranslationRequest):
    spoken_text = request.text.lower()
    for name, code in LANGUAGE_MAP.items():
        if name in spoken_text:
            return {"code": code}
    return {"code": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)