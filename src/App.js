import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// PDF Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Language Data
const indianLanguages = [
  { name: "Assamese", code: "as", voice: "as-IN" },
  { name: "Bengali", code: "bn", voice: "bn-IN" },
  { name: "Bodo", code: "brx", voice: "hi-IN" },
  { name: "Dogri", code: "doi", voice: "hi-IN" },
  { name: "Gujarati", code: "gu", voice: "gu-IN" },
  { name: "Hindi", code: "hi", voice: "hi-IN" },
  { name: "Kannada", code: "kn", voice: "kn-IN" },
  { name: "Kashmiri", code: "ks", voice: "hi-IN" },
  { name: "Konkani", code: "kok", voice: "hi-IN" },
  { name: "Maithili", code: "mai", voice: "hi-IN" },
  { name: "Malayalam", code: "ml", voice: "ml-IN" },
  { name: "Manipuri", code: "mni-Mtei", voice: "hi-IN" },
  { name: "Marathi", code: "mr", voice: "mr-IN" },
  { name: "Nepali", code: "ne", voice: "ne-NP" },
  { name: "Odia", code: "or", voice: "or-IN" },
  { name: "Punjabi", code: "pa", voice: "pa-IN" },
  { name: "Sanskrit", code: "sa", voice: "hi-IN" },
  { name: "Santali", code: "sat", voice: "hi-IN" },
  { name: "Sindhi", code: "sd", voice: "hi-IN" },
  { name: "Tamil", code: "ta", voice: "ta-IN" },
  { name: "Telugu", code: "te", voice: "te-IN" },
  { name: "Urdu", code: "ur", voice: "ur-PK" },
  { name: "English", code: "en", voice: "en-US" }
];

function App() {
  // --- STATE MANAGEMENT ---
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [step, setStep] = useState("idle");
  const [pdfFile, setPdfFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isSummaryMode, setIsSummaryMode] = useState(false); // Added Summary Mode State

  // --- VOICE RECOGNITION ---
  const startListeningForLanguage = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      try {
        const response = await fetch("http://localhost:8000/parse-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText, dest: "" })
        });
        const data = await response.json();

        if (data.code) {
          const langObj = indianLanguages.find(l => l.code === data.code);
          // Auto-trigger translation with the current mode
          handleTranslate(data.code, langObj.voice, isSummaryMode ? "summary" : "translate");
        } else {
          speak("Language not recognized. Try saying: Translate to Telugu", "en-US");
        }
      } catch (err) {
        console.error("Parse error:", err);
      }
    };
    recognition.start();
  };

  // --- FILE HANDLING ---
  const handleFileLoad = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        setTotalPages(pdf.numPages);
        setPdfFile(pdf);
        setStep("page-select");
      };
      reader.readAsArrayBuffer(file);
    } else {
      runOCR(file);
    }
  };

  // --- OCR LOGIC ---
  const runOCR = async (source) => {
    setStep("scanning");
    try {
      const { data: { text } } = await Tesseract.recognize(source, 'eng+hin+tel+tam+kan+mar+guj+ben+pan+mal');
      setOriginalText(text);
      setStep("choosing");
      speak("Found text. Select a language.", "en-US");
    } catch (error) {
      setStep("idle");
    }
  };

  // --- TRANSLATION LOGIC (UPDATED FOR SUMMARY) ---
  const handleTranslate = async (targetLang, voiceCode, mode = "translate") => {
    setStep("translating");
    try {
      const response = await fetch("http://localhost:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: originalText, 
          dest: targetLang,
          mode: mode // Send "summary" or "translate" to backend
        })
      });
      const data = await response.json();
      setTranslatedText(data.translated_text);
      setStep("playing");
      speak(data.translated_text, voiceCode);
    } catch (err) {
      setStep("playing");
      setTranslatedText("Error connecting to AI. Reading original text.");
      speak(originalText, "en-US");
    }
  };

  // --- TTS LOGIC ---
  const speak = (content, lang) => {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(content);
    speech.lang = lang;
    speech.rate = speechRate; 
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'yellow', fontFamily: 'sans-serif' }}>
      
      {/* 1. IDLE SCREEN */}
      {step === "idle" && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <label style={{ backgroundColor: '#FFFF00', color: 'black', padding: '30px', fontSize: '24px', fontWeight: 'bold', borderRadius: '15px', cursor: 'pointer' }}>
            📷 SCAN IMAGE OR PDF
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFileLoad} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {/* 2. PDF PAGE SELECT */}
      {step === "page-select" && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px', overflowY: 'auto' }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={async () => {
              const page = await pdfFile.getPage(i + 1);
              const canvas = document.createElement('canvas');
              const viewport = page.getViewport({ scale: 1.5 });
              canvas.height = viewport.height; canvas.width = viewport.width;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              runOCR(canvas);
            }} style={{ backgroundColor: '#00FF00', height: '80px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px' }}>PAGE {i + 1}</button>
          ))}
        </div>
      )}

      {/* 3. LOADING SCREEN */}
      {(step === "scanning" || step === "translating") && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px' }}>WORKING...</div>
      )}

      {/* 4. CHOOSING SCREEN (UPDATED) */}
      {step === "choosing" && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
          
          {/* Microphone Button */}
          <button 
            onClick={startListeningForLanguage}
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              backgroundColor: isListening ? 'red' : 'yellow', 
              fontSize: '30px', border: 'none',
              boxShadow: isListening ? '0 0 20px red' : 'none',
              marginBottom: '10px'
            }}
          >🎤</button>
          <p style={{ color: 'white', margin: '0 0 20px 0' }}>{isListening ? "Listening..." : "Tap & Say Language"}</p>

          {/* Mode Toggle Button */}
          <button 
            onClick={() => {
              setIsSummaryMode(!isSummaryMode);
              if (window.navigator.vibrate) window.navigator.vibrate(30);
            }}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: isSummaryMode ? '#FFD700' : '#333',
              color: isSummaryMode ? 'black' : 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              borderRadius: '10px',
              border: '2px solid #555',
              marginBottom: '15px'
            }}
          >
            {isSummaryMode ? "✨ MODE: SUMMARY (SHORT)" : "📝 MODE: FULL TEXT"}
          </button>
          
          {/* Language Grid */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
            {indianLanguages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => {
                   if (window.navigator.vibrate) window.navigator.vibrate(50);
                   handleTranslate(lang.code, lang.voice, isSummaryMode ? "summary" : "translate");
                }} 
                style={{ 
                  backgroundColor: lang.code === 'te' ? '#00FF00' : lang.code === 'hi' ? '#00BFFF' : '#444', 
                  color: (lang.code === 'te' || lang.code === 'hi') ? 'black' : 'white',
                  padding: '20px', fontSize: '16px', fontWeight: 'bold', borderRadius: '12px', border: 'none' 
                }}
              >{lang.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* 5. PLAYING SCREEN */}
      {step === "playing" && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto', fontSize: '20px', color: 'white', backgroundColor: '#222', borderRadius: '10px', border: '1px solid #444' }}>
            {translatedText}
          </div>

          {/* Speed Slider */}
          <div style={{ padding: '15px', backgroundColor: '#333', borderRadius: '10px', margin: '10px 0' }}>
            <label style={{ color: 'yellow', fontSize: '14px' }}>Reading Speed: {speechRate}x</label>
            <input 
              type="range" min="0.5" max="2.0" step="0.1" 
              value={speechRate} 
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(translatedText);
                alert("Copied to clipboard!");
              }} 
              style={{ height: '60px', backgroundColor: '#00BFFF', color: 'black', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none' }}
            >📋 COPY</button>

            <button 
              onClick={() => window.speechSynthesis.cancel()} 
              style={{ height: '60px', backgroundColor: 'orange', color: 'black', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none' }}
            >🛑 STOP</button>
          </div>

          <button 
            onClick={() => { window.speechSynthesis.cancel(); setStep("idle"); }} 
            style={{ height: '60px', backgroundColor: 'red', color: 'white', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', borderRadius: '10px', border: 'none' }}
          >BACK / వెనుకకు</button>
        </div>
      )}
    </div>
  );
}

export default App;