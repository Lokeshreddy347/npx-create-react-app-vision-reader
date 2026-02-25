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




# 👁️ Vision Reader (AI-Powered Accessibility Tool)

![Status](https://img.shields.io/badge/Status-Active-success)
![Tech](https://img.shields.io/badge/Stack-React_|_FastAPI_|_Gemini-blue)
![AI](https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-orange)

**Vision Reader** is a Progressive Web App (PWA) designed to bridge the literacy and language gap for Indian users. It turns any smartphone into an intelligent reading assistant for the visually impaired and elderly.

By combining **On-Device OCR** with **Generative AI** and **Server-Side Audio Synthesis**, Vision Reader scans physical documents, translates them into 10+ Indian languages, and reads them aloud with high-fidelity native accents.

---

## 🚀 Key Features

* **📷 Instant OCR:** Extracts text from camera images or PDFs using Tesseract.js (WebAssembly).
* **🧠 GenAI Translation:** Powered by **Google Gemini 2.5 Flash** for context-aware translations in 10+ languages (Telugu, Hindi, Tamil, etc.).
* **🔊 Server-Side Neural Audio:** Bypasses limited browser voices by streaming high-quality MP3 audio generated via Python (gTTS) on the edge server.
* **🗃️ History Drawer:** Automatically saves the last 5 scans to LocalStorage for offline retrieval.
* **🎨 "Living" HUD Interface:** High-contrast, futuristic UI designed for accessibility, featuring laser scanning animations and audio wave visualizers.
* **🇮🇳 Native Language Grid:** Displays language options in their native script (e.g., "తెలుగు" instead of "Telugu") to aid illiterate users.

---

## 🛠️ Tech Stack

### **Frontend (Client)**
* **Framework:** React.js
* **OCR Engine:** Tesseract.js (On-device processing)
* **PDF Processing:** PDF.js
* **State Management:** React Hooks + LocalStorage
* **Styling:** CSS-in-JS, CSS Animations

### **Backend (Server)**
* **Framework:** Python FastAPI
* **Server:** Uvicorn (ASGI)
* **API Security:** CORSMiddleware (Local Network Access)
* **Audio Processing:** IO Byte Streams (In-memory MP3 generation)

### **AI & APIs**
* **LLM:** Google Gemini 2.5 Flash (via `google-genai` SDK)
* **TTS:** gTTS (Google Text-to-Speech)
* **Computer Vision:** LSTM-based OCR models

---

## 🏗️ Architecture

The app follows a **Hybrid Client-Server Architecture**:

```mermaid
graph TD
    A[Mobile Client (React)] -->|1. Image Upload| B[Tesseract OCR (Browser)]
    B -->|2. Extracted Text| A
    A -->|3. POST /translate| C[FastAPI Server (Python)]
    C -->|4. Prompt Engineering| D[Google Gemini 2.5 Flash]
    D -->|5. Translated Text| C
    C -->|6. JSON Response| A
    A -->|7. POST /speak| C
    C -->|8. Generate MP3| E[gTTS Engine]
    E -->|9. Audio Stream (Blob)| A
    A -->|10. Play Audio| F[User Speaker]


    Here is how to kill the old process and start fresh.

🔪 Step 1: Kill the Zombie Ngrok
Since you might have closed the window but the process is still alive, let's force-quit it.

Open your Terminal (PowerShell).

Run this command to kill all ngrok processes:

PowerShell
taskkill /f /im ngrok.exe
(If it says "SUCCESS", good. If it says "not found", that's also fine.)

🚀 Step 2: Restart Properly
Now that the "zombie" is dead, start it again.

Make sure your ngrok.yml file is saved and looks correct (with the backend having the hostname and frontend having NO hostname).

Run the start command:

PowerShell
ngrok start --all --config=ngrok.yml
You should now see the two green "online" lines.

Copy the SECOND link (the random one pointing to localhost:3000).

Share that link with your friends.

⚠️ Final Checklist (Before you share)
For the link to work for your friends, you must keep these 3 things running on your laptop:

✅ Python Terminal: python main.py (The Brain)

✅ React Terminal: npm start (The Face)

✅ Ngrok Terminal: ngrok start --all --config=ngrok.yml (The Tunnel)

If you close your laptop or any of these windows, the link will die.