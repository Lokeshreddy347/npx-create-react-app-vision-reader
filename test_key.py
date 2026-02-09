import google.generativeai as genai
import os

# Paste your key here directly to test
genai.configure(api_key="AIzaSyCkqEvQrv6i4_857jjLqN64LPVGwfYenyU")

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, are you working?")
    print("✅ SUCCESS! Gemini says:", response.text)
except Exception as e:
    print("❌ ERROR:", e)