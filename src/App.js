import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// PDF Worker Setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Language Data
const indianLanguages = [
  { name: "Telugu", native: "తెలుగు", code: "te", color: "#4CC9F0" }, 
  { name: "Hindi", native: "हिंदी", code: "hi", color: "#F72585" },
  { name: "Tamil", native: "தமிழ்", code: "ta", color: "#4361EE" },
  { name: "Kannada", native: "ಕನ್ನಡ", code: "kn", color: "#7209B7" },
  { name: "Malayalam", native: "മലയാളം", code: "ml", color: "#3A0CA3" },
  { name: "Bengali", native: "বাংলা", code: "bn", color: "#F72585" },
  { name: "Gujarati", native: "ગુજરાતી", code: "gu", color: "#4CC9F0" },
  { name: "Marathi", native: "मराठी", code: "mr", color: "#F72585" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", code: "pa", color: "#4361EE" },
  { name: "English", native: "English", code: "en", color: "#ffffff" }
];

function App() {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [step, setStep] = useState("idle");
  const [pdfFile, setPdfFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSummaryMode, setIsSummaryMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); 
  
  // SPLASH SCREEN STATE
  const [showSplash, setShowSplash] = useState(true);

  // HISTORY STATE
  const [history, setHistory] = useState([]);

  // 1. Startup Logic (Splash + History)
  useEffect(() => {
    // Load History
    const saved = localStorage.getItem('scanHistory');
    if (saved) setHistory(JSON.parse(saved));
    
    // Splash Screen Timer (2.5 Seconds)
    setTimeout(() => {
      setShowSplash(false);
      speak("Welcome to TranslaMate AI.", "en-US");
    }, 2500);
  }, []);

  // 2. Save History Function
  const saveToHistory = (text, langCode) => {
    const newEntry = {
        id: Date.now(),
        text: text,
        lang: langCode,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
  };

   // 3. Audio Engine (With Ngrok Bypass)
  const speak = async (content, lang) => {
    window.speechSynthesis.cancel();
    
    if (lang === 'en-US' && content.length < 100) {
        const speech = new SpeechSynthesisUtterance(content);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
        return;
    }

    try {
        setStatusMessage("🔊 Downloading Audio...");
        // 👇 Ngrok URL
        const backendUrl = "https://strophically-unboasting-laverne.ngrok-free.dev/speak";
        
        const response = await fetch(backendUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true" // 👈 CRITICAL FIX
            },
            body: JSON.stringify({ text: content, lang: lang })
        });
        
        if (!response.ok) throw new Error("Audio Failed");
        
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        setStatusMessage("▶️ Playing Voice...");
        audio.play();
        audio.onended = () => setStatusMessage("");

    } catch (err) {
        console.error("TTS Error:", err);
        setStatusMessage("⚠️ Audio Error");
        const speech = new SpeechSynthesisUtterance(content);
        speech.lang = lang; 
        window.speechSynthesis.speak(speech);
    }
  };
  // 4. Translation Logic (With Ngrok Bypass)
  const handleTranslate = async (targetLang, mode) => {
    setStep("translating");
    setStatusMessage("Translating...");
    try {
      // 👇 Ngrok URL
     const backendUrl = "https://strophically-unboasting-laverne.ngrok-free.dev/translate";
      
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true" // 👈 CRITICAL FIX
        },
        body: JSON.stringify({ text: originalText, dest: targetLang, mode: mode })
      });
      
      const data = await response.json();
      
      if (data.translated_text) {
        setTranslatedText(data.translated_text);
        saveToHistory(data.translated_text, targetLang);
        setStep("playing");
        speak(data.translated_text, targetLang);
      } else {
        throw new Error("Empty translation");
      }
    } catch (err) {
      setStep("playing"); 
      setTranslatedText(`Error: ${err.message}`);
      speak("Connection error.", "en-US");
    }
  };

  // 5. File & OCR Handling
  const handleFileLoad = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setOriginalText("");
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

  const runOCR = async (source) => {
    setStep("scanning");
    setStatusMessage("Scanning...");
    try {
      const { data: { text } } = await Tesseract.recognize(source, 'eng+hin+tel+tam+kan+mar+guj+ben+pan');
      setOriginalText(text);
      setStep("choosing");
      setStatusMessage("");
      speak("Text found. Select Language.", "en-US");
    } catch (error) {
      setStep("idle");
      speak("Scanning failed.", "en-US");
    }
  };

  return (
    <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        color: 'white', 
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#050505'
    }}>

      {/* 🌟 SPLASH SCREEN OVERLAY */}
      <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'black',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'opacity 1s ease-out',
          opacity: showSplash ? 1 : 0,
          pointerEvents: showSplash ? 'auto' : 'none',
      }}>
          <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'linear-gradient(45deg, #FF00FF, #00FFFF)',
              animation: 'spin 2s linear infinite',
              marginBottom: '30px',
              boxShadow: '0 0 50px rgba(0, 255, 255, 0.5)'
          }}></div>
          <h1 style={{
              fontSize: '40px', fontWeight: 'bold', 
              background: '-webkit-linear-gradient(#00FFFF, #FF00FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '2px',
              animation: 'fadeIn 2s ease-in'
          }}>TranslaMate AI</h1>
          <p style={{color: '#666', marginTop: '10px', letterSpacing: '4px', fontSize: '12px'}}>POWERED BY GEMINI</p>
      </div>
      <style>{`
          @keyframes spin { 0% {transform: rotate(0deg)} 100% {transform: rotate(360deg)} }
          @keyframes fadeIn { 0% {opacity:0; transform: translateY(20px)} 100% {opacity:1; transform: translateY(0)} }
      `}</style>


      {/* 🌌 BACKGROUND ANIMATION */}
      <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
          backgroundImage: `linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          boxShadow: 'inset 0 0 150px black'
      }}></div>

      {/* ⚡ CONTENT LAYER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' }}>
        
        {/* Status Bar */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#00FF00', padding: '15px', textAlign: 'center', fontSize: '12px', letterSpacing: '2px', borderBottom: '1px solid #222', textShadow: '0 0 5px #00FF00' }}>
            {statusMessage || "• TRANSLAMATE AI ONLINE •"}
        </div>

        {/* --- STEP 1: IDLE SCREEN (Redesigned) --- */}
        {step === "idle" && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* BIG CENTER CAMERA BUTTON */}
            <div style={{ position: 'relative' }}>
                <label style={{ 
                    width: '120px', height: '120px', 
                    borderRadius: '50%', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    border: '4px solid #00FFFF', 
                    boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)', 
                    cursor: 'pointer', 
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    animation: 'pulseBtn 2s infinite' 
                }}>
                    <span style={{fontSize: '50px'}}>📸</span>
                    <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFileLoad} style={{ display: 'none' }} />
                </label>
                <div style={{marginTop: '20px', color: '#00FFFF', fontSize: '14px', letterSpacing: '2px', textAlign: 'center', textShadow: '0 0 10px #00FFFF'}}>
                    TAP TO SCAN
                </div>
            </div>
            
            <style>{`@keyframes pulseBtn { 0% {transform: scale(1); boxShadow: 0 0 20px rgba(0,255,255,0.2)} 50% {transform: scale(1.1); boxShadow: 0 0 50px rgba(0,255,255,0.6)} 100% {transform: scale(1); boxShadow: 0 0 20px rgba(0,255,255,0.2)} }`}</style>

            {/* HISTORY DRAWER (At Bottom) */}
            {history.length > 0 && (
                <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '15px', overflowX: 'auto', display: 'flex', gap: '15px', backgroundColor: 'rgba(10,10,10,0.95)', borderTop: '1px solid #333' }}>
                    <div style={{color: '#666', writingMode: 'vertical-rl', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px'}}>RECENT</div>
                    {history.map(item => (
                        <div key={item.id} onClick={() => { setTranslatedText(item.text); setStep("playing"); }} 
                            style={{ minWidth: '140px', padding: '10px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer' }}>
                            <div style={{fontSize: '10px', color: '#00FFFF', marginBottom: '4px', fontWeight: 'bold'}}>{item.date} • {item.lang.toUpperCase()}</div>
                            <div style={{fontSize: '12px', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.text}</div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        )}

        {/* --- STEP 2: PDF SELECT --- */}
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
                }} style={{ backgroundColor: 'rgba(0,255,0,0.1)', color: '#00FF00', height: '100px', fontSize: '20px', fontWeight: 'bold', borderRadius: '15px', border: '1px solid #00FF00' }}>
                PAGE {i + 1}
                </button>
            ))}
            </div>
        )}

        {/* --- STEP 3: SCANNING --- */}
        {(step === "scanning" || step === "translating") && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '260px', height: '360px', border: '2px solid #333', borderRadius: '20px', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: '0 0 30px rgba(0,255,255,0.1)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#00FFFF', boxShadow: '0 0 20px #00FFFF', animation: 'scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></div>
                </div>
                <h2 style={{color: '#00FFFF', marginTop: '30px', fontFamily: 'monospace', letterSpacing: '3px', textShadow: '0 0 10px #00FFFF'}}>PROCESSING...</h2>
                <style>{`@keyframes scan { 0% {top:0%; opacity:0.8} 50% {opacity:1} 100% {top:100%; opacity:0.8} }`}</style>
            </div>
        )}

        {/* --- STEP 4: LANGUAGE GRID --- */}
        {step === "choosing" && (
            <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                <button onClick={() => setIsSummaryMode(!isSummaryMode)} style={{ flex: 1, padding: '15px', backgroundColor: isSummaryMode ? '#FFD700' : 'rgba(30,30,30,0.8)', color: isSummaryMode ? 'black' : 'white', borderRadius: '10px', border: '1px solid #444', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                    {isSummaryMode ? "✨ SHORT SUMMARY" : "📝 FULL TRANSLATION"}
                </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {indianLanguages.map(l => (
                        <button key={l.code} onClick={() => {
                            if (window.navigator.vibrate) window.navigator.vibrate(15);
                            handleTranslate(l.code, isSummaryMode ? "summary" : "translate")
                        }} style={{ padding: '15px', backgroundColor: 'rgba(10,10,10,0.8)', border: `1px solid ${l.color}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '110px', boxShadow: `0 0 10px ${l.color}20` }}>
                            <span style={{fontSize: '28px', color: 'white', fontWeight: 'bold', marginBottom: '5px', textShadow: `0 0 10px ${l.color}`}}>{l.native}</span>
                            <span style={{fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px'}}>{l.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* --- STEP 5: PLAYBACK --- */}
        {step === "playing" && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                {[...Array(8)].map((_,i) => <div key={i} style={{width:'6px', height:'20px', background:'#00FFFF', borderRadius: '4px', boxShadow: '0 0 10px #00FFFF', animation:`wave 1s ease-in-out infinite ${i*0.1}s`}}></div>)}
            </div>
            <style>{`@keyframes wave { 0%,100%{height:10px; opacity:0.5} 50%{height:50px; opacity:1} }`}</style>

            <div style={{ 
                flex: 1, padding: '25px', overflowY: 'auto', fontSize: '24px', lineHeight: '1.6', 
                color: 'white', backgroundColor: 'rgba(10,10,10,0.9)', borderRadius: '20px', 
                border: '1px solid #333', boxShadow: '0 0 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'
            }}>
                {translatedText}
            </div>
                
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <button onClick={() => { window.speechSynthesis.cancel(); setStatusMessage("Paused"); }} style={{ height: '60px', backgroundColor: '#FF8800', color: 'black', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold' }}>⏸ PAUSE</button>
                <button onClick={() => { window.speechSynthesis.cancel(); setStep("idle"); }} style={{ height: '60px', backgroundColor: '#FF0000', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold' }}>BACK</button>
            </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;