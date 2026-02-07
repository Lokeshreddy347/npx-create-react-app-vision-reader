# 👁️ Netra: AI Vision-to-Voice Assistant

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Tesseract.js](https://img.shields.io/badge/OCR-Tesseract.js-blue)](https://tesseract.projectnaptha.com/)
[![Social Good](https://img.shields.io/badge/Impact-Social%20Good-green)](https://github.com/topics/social-good)

> **"Bridging the literacy gap in India with AI."**

**Netra** (also known as *Drishti AI*) is an accessibility-focused mobile web application designed to help illiterate, elderly, and visually impaired users understand documents. 

Unlike standard translators, Netra uses **Generative AI (Google Gemini)** to not just translate, but **summarize and simplify** complex text (like government forms, bills, or newspapers) into spoken audio in **22 Indian languages**.

---

## 🌟 Key Features

* **🗣️ Voice-First Interface:** Users can navigate the app using voice commands (e.g., *"Translate to Hindi"*), eliminating the need to read small buttons.
* **🧠 Intelligent Summarization:** Toggles between "Full Reading" and "Simple Summary" modes. It can turn a complex 2-page legal document into a 3-sentence spoken summary.
* **📷 Multi-Format Input:** Supports real-time camera scanning (with environment capture) and PDF document uploads.
* **📳 Haptic Feedback:** Uses the Navigator API to provide physical vibration feedback for low-vision users.
* **🇮🇳 22 Language Support:** Full support for the 8th Schedule of the Indian Constitution, including Telugu, Tamil, Hindi, Marathi, and more.
* **⚡ Client-Side OCR:** Uses `Tesseract.js` in the browser to extract text quickly with low server overhead.

---

## 🏗️ Architecture

The system follows a **Hybrid Client-Server** architecture to maximize speed and accessibility.

1.  **Frontend (React + Tesseract):** Captures image/PDF and performs OCR locally to extract raw text.
2.  **Voice Layer (Web Speech API):** Listens for user intent (e.g., "Hindi") and captures the spoken command.
3.  **Backend (FastAPI + Python):** Receives the raw text and user intent.
4.  **AI Engine (Google Gemini):** Processes the text. If "Summary Mode" is on, it simplifies the language. If "Translate" is on, it preserves the structure.
5.  **Output:** The simplified, translated text is sent back to the phone, which uses native Text-to-Speech to read it aloud.

---

## 🛠️ Tech Stack

| Component | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI/UX and State Management |
| **OCR** | Tesseract.js | In-browser Optical Character Recognition |
| **Backend** | FastAPI (Python) | High-performance API server |
| **AI Model** | Google Gemini 1.5 Flash | Translation, Summarization & Simplification |
| **Voice** | Web Speech API | Speech-to-Text & Text-to-Speech |
| **PDF** | PDF.js | Rendering PDF pages for selection |

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)
* Google Gemini API Key ([Get it here](https://aistudio.google.com/))

### 1. Backend Setup (Python)
```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/netra-ai.git](https://github.com/YOUR_USERNAME/netra-ai.git)
cd netra-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn google-generativeai pydantic

# Add your API Key
# Open main.py and replace "YOUR_API_KEY" with your actual Google Gemini Key.

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000


# Navigate to frontend folder
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm start