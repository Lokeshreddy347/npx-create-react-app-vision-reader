import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// PDF Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Full Language Data 
// (We only need the code 'te', 'hi' etc. for the Python backend now)
const indianLanguages = [
  { name: "Assamese", code: "as" },
  { name: "Bengali", code: "bn" },
  { name: "Bodo", code: "brx" },
  { name: "Dogri", code: "doi" },
  { name: "Gujarati", code: "gu" },
  { name: "Hindi", code: "hi" },
  { name: "Kannada", code: "kn" },
  { name: "Kashmiri", code: "ks" },
  { name: "Konkani", code: "kok" },
  { name: "Maithili", code: "mai" },
  { name: "Malayalam", code: "ml" },
  { name: "Manipuri", code: "mni" },
  { name: "Marathi", code: "mr" },
  { name: "Nepali", code: "ne" },
  { name: "Odia", code: "or" },
  { name: "Punjabi", code: "pa" },
  { name: "Sanskrit", code: "sa" },
  { name: "Santali", code: "sat" },
  { name: "Sindhi", code: "sd" },
  { name: "Tamil", code: "ta" },
  { name: "Telugu", code: "te" },
  { name: "Urdu", code: "ur" },
  { name: "English", code: "en" }
];

function App() {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [step, setStep] = useState("idle");
  const [pdfFile, setPdfFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSummaryMode, setIsSummaryMode] = useState(false);
  
  // NEW: Status message to show "Fetching Audio..." on screen
  const [statusMessage, setStatusMessage] = useState(""); 

  // 1. Welcome Message
  useEffect(() => {
    setTimeout(() => {
      // We use 'en-US' for UI messages (fast browser voice)
      speak("Welcome to Vision Reader. Tap yellow button.", "en-US");
    }, 1000);
  }, []);

  // --- 🔊 THE NEW HYBRID AUDIO LOGIC ---
  const speak = async (content, lang) => {
    // 1. Stop any current speaking
    window.speechSynthesis.cancel();
    
    // 2. CHECK: Is this a short English UI message? (Like "Welcome" or "Scanning...")
    // If yes, use the Browser Voice because it is faster for simple things.
    if (lang === 'en-US' && content.length < 100) {
        const speech = new SpeechSynthesisUtterance(content);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
        return;
    }

    // 3. MAIN LOGIC: If it is Translation (Telugu, Hindi, etc.), GET AUDIO FROM SERVER
    try {
        setStatusMessage("🔊 Downloading Audio...");
        
        // Smart IP Detection
        const backendUrl = `http://${window.location.hostname}:8000/speak`;
        
        console.log("Fetching audio from:", backendUrl);

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                text: content, 
                lang: lang 
            })
        });

        if (!response.ok) throw new Error("Server Audio Failed");

        // 4. Play the MP3 received from Python
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        setStatusMessage("▶️ Playing Voice...");
        audio.play();
        
        audio.onended = () => setStatusMessage(""); // Clear status when done

    } catch (err) {
        console.error("TTS Error:", err);
        setStatusMessage("⚠️ Audio Error. Check Python Terminal.");
        
        // Emergency Fallback: Try browser voice if server fails
        const speech = new SpeechSynthesisUtterance(content);
        speech.lang = lang; // Might fail on phone, but worth a try
        window.speechSynthesis.speak(speech);
    }
  };

  // --- VOICE RECOGNITION ---
  const startListeningForLanguage = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      try {
        const backendUrl = `http://${window.location.hostname}:8000/parse-language`;
        const response = await fetch(backendUrl, { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText, dest: "en" })
        });
        const data = await response.json();

        if (data.code) {
          const langObj = indianLanguages.find(l => l.code === data.code);
          speak(`Translating to ${langObj.name}`, "en-US");
          // Use the pure code (e.g., 'te') for the backend
          handleTranslate(data.code, isSummaryMode ? "summary" : "translate");
        } else {
          speak("I didn't understand. Try 'Telugu' or 'Hindi'.", "en-US");
        }
      } catch (err) {
        speak("Connection error.", "en-US");
      }
    };
    recognition.start();
  };

  // --- FILE HANDLING ---
  const handleFileLoad = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setOriginalText("");
    setTranslatedText("");

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        setTotalPages(pdf.numPages);
        setPdfFile(pdf);
        setStep("page-select");
        speak(`PDF loaded with ${pdf.numPages} pages.`, "en-US");
      };
      reader.readAsArrayBuffer(file);
    } else {
      runOCR(file);
    }
  };

  // --- OCR LOGIC ---
  const runOCR = async (source) => {
    setStep("scanning");
    setStatusMessage("Reading Text...");
    try {
      const { data: { text } } = await Tesseract.recognize(
        source, 
        'eng+hin+tel+tam+kan+mar+guj+ben+pan', 
        { logger: m => console.log(m.status) }
      );
      
      if (!text || text.trim().length < 5) {
        speak("No text found. Try again.", "en-US");
        setStep("idle");
      } else {
        setOriginalText(text);
        setStep("choosing");
        setStatusMessage("");
        speak("Text found. Select Language.", "en-US");
      }
    } catch (error) {
      setStep("idle");
      speak("Scanning failed.", "en-US");
    }
  };

  // --- TRANSLATION LOGIC ---
  const handleTranslate = async (targetLang, mode) => {
    setStep("translating");
    setStatusMessage("Translating...");
    try {
      const backendUrl = `http://${window.location.hostname}:8000/translate`;
      
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: originalText, 
          dest: targetLang,
          mode: mode 
        })
      });

      const data = await response.json();
      
      if (data.translated_text) {
        setTranslatedText(data.translated_text);
        setStep("playing");
        // CRITICAL: Call speak with the target language code (e.g., 'te')
        speak(data.translated_text, targetLang);
      } else {
        throw new Error("Empty translation");
      }
    } catch (err) {
      setStep("playing"); 
      setTranslatedText(`Error: ${err.message}`);
      speak("I cannot connect to the server.", "en-US");
    }
  };

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'yellow', fontFamily: 'Arial, sans-serif' }}>
      
      {/* NEW: STATUS BAR (Shows what the app is doing) */}
      <div style={{ backgroundColor: '#222', color: '#00FF00', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #444' }}>
        {statusMessage || "• READY •"}
      </div>

      {/* 1. IDLE SCREEN */}
      {step === "idle" && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <label style={{ backgroundColor: '#FFFF00', color: 'black', width: '90%', padding: '50px 20px', fontSize: '30px', fontWeight: 'bold', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', border: '5px solid white' }}>
            📷 TAP TO SCAN
            <br/><span style={{fontSize: '20px'}}>(Camera / PDF)</span>
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFileLoad} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {/* 2. PDF PAGE SELECT */}
      {step === "page-select" && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', overflowY: 'auto' }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={async () => {
              const page = await pdfFile.getPage(i + 1);
              const canvas = document.createElement('canvas');
              const viewport = page.getViewport({ scale: 1.5 });
              canvas.height = viewport.height; canvas.width = viewport.width;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              runOCR(canvas);
            }} style={{ backgroundColor: '#00FF00', height: '100px', fontSize: '20px', fontWeight: 'bold', borderRadius: '15px', border: 'none' }}>
              PAGE {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 3. LOADING SCREEN */}
      {(step === "scanning" || step === "translating") && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '20px' }}>
            {step === "scanning" ? "READING..." : "THINKING..."}
          </div>
          <div style={{ width: '50px', height: '50px', border: '5px solid yellow', borderTop: '5px solid black', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 4. CHOOSING SCREEN */}
      {step === "choosing" && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}>
          
          <button 
            onClick={startListeningForLanguage}
            style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              backgroundColor: isListening ? 'red' : 'yellow', 
              fontSize: '40px', border: '5px solid white',
              boxShadow: isListening ? '0 0 30px red' : 'none',
              marginBottom: '20px'
            }}
          >🎤</button>
          <p style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
            {isListening ? "Listening..." : "Tap & Say Language"}
          </p>

          <button 
            onClick={() => {
              setIsSummaryMode(!isSummaryMode);
              if (window.navigator.vibrate) window.navigator.vibrate(30);
            }}
            style={{
              width: '100%', padding: '15px',
              backgroundColor: isSummaryMode ? '#FFD700' : '#333',
              color: isSummaryMode ? 'black' : 'white',
              fontWeight: 'bold', fontSize: '18px',
              borderRadius: '10px', border: '2px solid #555', marginBottom: '20px'
            }}
          >
            {isSummaryMode ? "✨ MODE: SHORT SUMMARY" : "📝 MODE: FULL TRANSLATION"}
          </button>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
            {indianLanguages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => {
                   if (window.navigator.vibrate) window.navigator.vibrate(50);
                   handleTranslate(lang.code, isSummaryMode ? "summary" : "translate");
                }} 
                style={{ 
                  backgroundColor: lang.code === 'te' ? '#00FF00' : '#444', 
                  color: lang.code === 'te' ? 'black' : 'white',
                  padding: '20px', fontSize: '18px', fontWeight: 'bold', 
                  borderRadius: '12px', border: 'none' 
                }}
              >{lang.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* 5. PLAYING SCREEN */}
      {step === "playing" && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px' }}>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto', fontSize: '24px', lineHeight: '1.6', color: 'white', backgroundColor: '#222', borderRadius: '15px', border: '2px solid yellow' }}>
            {translatedText}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <button 
              onClick={() => {
                  window.speechSynthesis.cancel();
                  // Stop any Audio objects by reloading the step (simple hack) or just letting it finish
                  setStatusMessage("Stopped.");
              }} 
              style={{ height: '60px', backgroundColor: 'orange', color: 'black', fontSize: '22px', fontWeight: 'bold', borderRadius: '15px', border: 'none' }}
            >🛑 STOP VOICE</button>
            
            <button 
              onClick={() => { window.speechSynthesis.cancel(); setStep("idle"); }} 
              style={{ height: '70px', backgroundColor: 'red', color: 'white', fontSize: '22px', fontWeight: 'bold', borderRadius: '15px', border: 'none' }}
            >BACK / START OVER</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;