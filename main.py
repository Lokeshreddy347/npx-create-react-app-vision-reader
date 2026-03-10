import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from gtts import gTTS
import io
import warnings

# 1. Hide Warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

app = FastAPI()

# 2. Allow Mobile Connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 3. SETUP GEMINI (Securely fetching from Render!)
my_secret_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=my_secret_key)
# 4. USE THE WORKING MODEL
model = genai.GenerativeModel("gemini-1.5-flash")
class TranslationRequest(BaseModel):
    text: str
    dest: str = "en"
    mode: str = "translate"

class SpeakRequest(BaseModel):
    text: str
    lang: str
    

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    try:
        print(f"📝 Translating to {request.dest}...")
        if request.mode == "summary":
            prompt = (f"Explain this text in language '{request.dest}' simply: {request.text}")
        else:
            prompt = (f"Translate this text to language '{request.dest}' accurately: {request.text}")
        
        response = model.generate_content(prompt)
        print("✅ Translation Done!")
        return {"translated_text": response.text}
            
    except Exception as e:
        print(f"❌ GEMINI ERROR: {e}")
        return {"translated_text": f"Error: {str(e)}"}

@app.post("/speak")
async def speak_text(request: SpeakRequest):
    try:
        print(f"🔊 Generating Audio for: {request.lang}")

        # Language mapping for gTTS
        lang_map = {
            "te": "te",
            "hi": "hi",
            "ta": "ta",
            "kn": "kn",
            "ml": "ml",
            "bn": "bn",
            "gu": "gu",
            "en": "en"
        }

        # Get language
        tts_lang = lang_map.get(request.lang, "en")

        # Generate speech
        tts = gTTS(text=request.text, lang=tts_lang, slow=False)

        # Save to memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        print("✅ Audio Sent to Phone")

        return Response(
            content=audio_buffer.read(),
            media_type="audio/mp3"
        )

    except Exception as e:
        print(f"❌ AUDIO ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

        # 2. Generate MP3 in memory
        tts = gTTS(text=request.text, lang=tts_lang, slow=False)
        
        # 3. Save to buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        print("✅ Audio Sent to Phone")
        return Response(content=audio_buffer.read(), media_type="audio/mp3")
    except Exception as e:
        print(f"❌ AUDIO ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # HOST 0.0.0.0 IS REQUIRED FOR MOBILE
    uvicorn.run(app, host="0.0.0.0", port=8000)