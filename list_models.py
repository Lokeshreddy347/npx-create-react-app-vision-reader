import google.generativeai as genai
import os

# Your Key
genai.configure(api_key="AIzaSyDP_DxrklNYNC21FWhsnAXmXhj7e0MdBPY")

print("🔍 Searching for available models...")

try:
    # List all models available to your API key
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ FOUND: {m.name}")
            
except Exception as e:
    print(f"❌ Error: {e}")