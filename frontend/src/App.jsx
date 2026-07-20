import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Sprout, Activity, ClipboardCheck, Volume2, RotateCcw, ArrowRight, ArrowLeft, Play, Pause, FastForward, Rewind, Mic, MicOff, Camera, Upload, History, Save, Globe } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const tDict = {
  en: {
    soil_ai: "Soil AI", crop_doctor: "Crop Doctor", dashboard: "Dashboard",
    probe_status: "Probe Status: Active", soil_diagnostics: "Soil Diagnostics",
    sync_live: "📡 Dip Probe & Read Values", analyze_history: "Analyze History",
    field_interview: "Field Interview", back: "Back",
    tap_speak: "Tap to Speak", listening: "Listening...",
    last_crop: "Last Crop Harvested?", rest_duration: "Time Since Last Crop?", plant_next: "What will you plant next?",
    generating: "AgriMind is Thinking...", gen_prescription: "Generate Prescription",
    ai_decision: "AI Decision", expert_alt: "Expert Alternatives",
    new_test: "New Test", save_db: "Save to DB", saving: "Saving...",
    upload_photo: "Take Photo (Camera)", analyze_disease: "Analyze Disease", scanning: "AI is Scanning...",
    disease_detected: "Disease Detected", diagnosis: "Diagnosis", treatment: "Treatment / Hal",
    listen_diagnosis: "Listen to Diagnosis", history_tracking: "Historical Tracking",
    nitrogen: "Nitrogen", phosphorus: "Phosphorus", potassium: "Potassium", ph: "pH Level", moisture: "Moisture Content",
    camera_instruction: "Take photos of the diseased crop or leaves.",
    no_history: "No historical data found. Save some reports first!",
    recent_tests: "Recent Tests", see_more: "See Details", see_less: "Hide Details",
    pre_sowing: "Pre-Sowing (New Crop)", growth_phase: "Growth Phase (Existing Crop)",
    soil_city: "Select Tehsil/City",
    soil_guide: "Soil Guide"
  },
  ur: {
    soil_ai: "مٹی کی جانچ", crop_doctor: "فصل کا ڈاکٹر", dashboard: "ڈیش بورڈ",
    probe_status: "پروب ایکٹو ہے", soil_diagnostics: "مٹی کی رپورٹ",
    sync_live: "📡 پروب ڈالیں اور ویلیوز لیں", analyze_history: "رپورٹ بنائیں",
    field_interview: "کھیت کا انٹرویو", back: "واپس",
    tap_speak: "بولنے کے لیے دبائیں", listening: "سن رہا ہے...",
    last_crop: "پچھلی فصل کونسی تھی؟", rest_duration: "پچھلی فصل کو کتنا وقت ہو گیا؟", plant_next: "اگلی فصل کونسی لگانی ہے؟",
    generating: "ایگری مائنڈ سوچ رہا ہے...", gen_prescription: "تجویز حاصل کریں",
    ai_decision: "حتمی فیصلہ", expert_alt: "متبادل فصلیں",
    new_test: "نیا ٹیسٹ", save_db: "محفوظ کریں", saving: "محفوظ ہو رہا ہے...",
    upload_photo: "تصویر لیں (کیمرہ)", analyze_disease: "بیماری چیک کریں", scanning: "چیک کر رہا ہے...",
    disease_detected: "بیماری", diagnosis: "تفصیل", treatment: "علاج / حل",
    listen_diagnosis: "آواز میں سنیں", history_tracking: "پرانا ریکارڈ",
    nitrogen: "نائٹروجن", phosphorus: "فاسفورس", potassium: "پوٹاشیم", ph: "پی ایچ (pH)", moisture: "نمی",
    camera_instruction: "بیمار فصل یا پتوں کی تصویر کھینچیں۔",
    no_history: "کوئی پرانا ریکارڈ نہیں ملا۔",
    recent_tests: "حالیہ ٹیسٹ", see_more: "مزید تفصیل دیکھیں", see_less: "تفصیل چھپائیں",
    pre_sowing: "نئی فصل لگانی ہے", growth_phase: "فصل لگی ہوئی ہے",
    current_crop: "موجودہ فصل", crop_stage: "فصل کی عمر / سٹیج",
    soil_city: "تحصیل / شہر منتخب کریں",
    soil_guide: "مٹی کا رہنما"
  },
  sd: {
    soil_ai: "مٽي جي جانچ", crop_doctor: "فصل جو ڊاڪٽر", dashboard: "ڊيش بورڊ",
    probe_status: "پروب ايڪٽو آهي", soil_diagnostics: "مٽي جي رپورٽ",
    sync_live: "📡 پروب وجھو ۽ ويليوز وٺو", analyze_history: "رپورٽ ٺاهيو",
    field_interview: "ٻني جو انٽرويو", back: "واپس",
    tap_speak: "ڳالهائڻ لاءِ دٻايو", listening: "ٻڌي رهيو آهي...",
    last_crop: "پويون فصل ڪهڙو هو؟", rest_duration: "پويون فصل ڪڏهن لٿو؟", plant_next: "اڳيون فصل ڪهڙو لڳائڻو آهي؟",
    generating: "ايگري مائينڊ سوچي رهيو آهي...", gen_prescription: "تجويز حاصل ڪريو",
    ai_decision: "حتمي فيصلو", expert_alt: "متبادل فصل",
    new_test: "نئون ٽيسٽ", save_db: "محفوظ ڪريو", saving: "محفوظ ٿي رهيو آهي...",
    upload_photo: "تصوير وٺو (ڪئميرا)", analyze_disease: "بيماري چيڪ ڪريو", scanning: "چيڪ ڪري رهيو آهي...",
    disease_detected: "بيماري", diagnosis: "تفصيل", treatment: "علاج / حل",
    listen_diagnosis: "آواز ۾ ٻڌو", history_tracking: "پراڻو رڪارڊ",
    nitrogen: "نائٹروجن", phosphorus: "فاسفورس", potassium: "پوٽاشيم", ph: "پي ايچ (pH)", moisture: "نمي",
    camera_instruction: "بيمار فصل يا پنن جي تصوير وٺو.",
    no_history: "ڪو به پراڻو رڪارڊ نه مليو.",
    recent_tests: "تازو ٽيسٽ", see_more: "وڌيڪ تفصيل ڏسو", see_less: "تفصيل لڪايو",
    current_crop: "موجوده فصل", crop_stage: "فصل جي عمر / اسٽيج",
    soil_city: "تعلقو / شهر چونڊيو",
    soil_guide: "مٽي جو رھنما"
  }
};

const cropDict = {
  en: {
    "Cotton": "Cotton", "Wheat": "Wheat", "Sugarcane": "Sugarcane", "Mango": "Mango", "Banana": "Banana",
    "Chilli": "Chilli", "Rice": "Rice", "Tomato": "Tomato", "Onion": "Onion", "Guava": "Guava",
    "Bajra": "Bajra", "Guar": "Guar", "Moth bean": "Moth bean", "Sunflower": "Sunflower", "Jowar": "Jowar",
    "Dates": "Dates", "Desert grasses": "Desert grasses", "None": "None"
  },
  ur: {
    "Cotton": "کپاس", "Wheat": "گندم", "Sugarcane": "گنا", "Mango": "آم", "Banana": "کیلا",
    "Chilli": "مرچ", "Rice": "چاول", "Tomato": "ٹماٹر", "Onion": "پیاز", "Guava": "امرود",
    "Bajra": "باجرہ", "Guar": "گوار", "Moth bean": "موٹھ", "Sunflower": "سورج مکھی", "Jowar": "جوار",
    "Dates": "کھجور", "Desert grasses": "صحرائی گھاس", "None": "کوئی نہیں"
  },
  sd: {
    "Cotton": "ڦٽي", "Wheat": "ڪڻڪ", "Sugarcane": "ڪماند", "Mango": "انب", "Banana": "ڪيلو",
    "Chilli": "مرچ", "Rice": "چانور", "Tomato": "ٽماٽو", "Onion": "بصر", "Guava": "زيتون",
    "Bajra": "ٻاجھري", "Guar": "گوار", "Moth bean": "مُوٺ", "Sunflower": "سورج مکي", "Jowar": "جوئر",
    "Dates": "کجور", "Desert grasses": "صحرا جو گاهه", "None": "ڪو به نه"
  }
};

const districtDict = {
  en: {
    "Mirpur Khas": "Mirpur Khas",
    "Umerkot": "Umerkot",
    "Tharparkar": "Tharparkar"
  },
  ur: {
    "Mirpur Khas": "میرپور خاص",
    "Umerkot": "عمرکوٹ",
    "Tharparkar": "تھرپارکر"
  },
  sd: {
    "Mirpur Khas": "ميرپور خاص",
    "Umerkot": "عمرڪوٽ",
    "Tharparkar": "ٿرپارڪر"
  }
};

const cityDict = {
  en: {
    "Digri": "Digri", "Hussain Bakhsh Mari": "Hussain Bakhsh Mari", "Jhuddo": "Jhuddo", 
    "Kot Ghulam Muhammad": "Kot Ghulam Muhammad", "Mirpur Khas": "Mirpur Khas", "Naukot": "Naukot", 
    "Shujabad": "Shujabad", "Sindhri": "Sindhri", "Tando Jan Muhammad": "Tando Jan Muhammad",
    "Kunri": "Kunri", "Pithoro": "Pithoro", "Samaro": "Samaro", "Umerkot": "Umerkot",
    "Chachro": "Chachro", "Dahli": "Dahli", "Diplo": "Diplo", "Islamkot": "Islamkot", 
    "Kaloi": "Kaloi", "Mithi": "Mithi", "Nagarparkar": "Nagarparkar"
  },
  ur: {
    "Digri": "ڈگری", "Hussain Bakhsh Mari": "حسین بخش مری", "Jhuddo": "جھڈو", 
    "Kot Ghulam Muhammad": "کوٹ غلام محمد", "Mirpur Khas": "میرپور خاص", "Naukot": "نوکوٹ", 
    "Shujabad": "شجاع آباد", "Sindhri": "سندھڑی", "Tando Jan Muhammad": "ٹنڈو جان محمد",
    "Kunri": "کنری", "Pithoro": "پتھورو", "Samaro": "سامارو", "Umerkot": "عمرکوٹ",
    "Chachro": "چھاچھرو", "Dahli": "ڈاہلی", "Diplo": "ڈپلو", "Islamkot": "اسلام کوٹ", 
    "Kaloi": "کالوئی", "Mithi": "مٹھی", "Nagarparkar": "نگرپارکر"
  },
  sd: {
    "Digri": "ڊگھڙي", "Hussain Bakhsh Mari": "حسين بخش مري", "Jhuddo": "جھڏو", 
    "Kot Ghulam Muhammad": "ڪوٽ غلام محمد", "Mirpur Khas": "ميرپور خاص", "Naukot": "نوڪوٽ", 
    "Shujabad": "شجاع آباد", "Sindhri": "سنڌڙي", "Tando Jan Muhammad": "ٽنڊو جان محمد",
    "Kunri": "ڪنري", "Pithoro": "پٿورو", "Samaro": "سامارو", "Umerkot": "عمرڪوٽ",
    "Chachro": "ڇاڇرو", "Dahli": "ڏاهلي", "Diplo": "ڏپلو", "Islamkot": "اسلام ڪوٽ", 
    "Kaloi": "ڪالوئي", "Mithi": "مٺي", "Nagarparkar": "نگرپارڪر"
  }
};

const initialFormData = {
  nitrogen: "", phosphorus: "", potassium: "", ph: "", moisture: "", location: "", soilSource: "Mirpur Khas", soilCity: "Mirpur Khas",
  prevCrop: "None", restDuration: "1 to 3 Weeks (1 se 3 Hafte)", plannedCrop: "Cotton", 
  testingPhase: "Pre-Sowing", stage: "Vegetative", lat: null, lng: null
};

function App() {
  const [lang, setLang] = useState('en');
  const t = (key) => tDict[lang][key] || key;
  const tCrop = (crop) => cropDict[lang][crop] || crop;
  const tDistrict = (dist) => (districtDict[lang] && districtDict[lang][dist]) || dist;
  const tCity = (city) => (cityDict[lang] && cityDict[lang][city]) || city;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [activeTab, setActiveTab] = useState('soil');
  const [doctorImages, setDoctorImages] = useState([]); // array to store multiple images
  const [doctorResult, setDoctorResult] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [expandedAlt, setExpandedAlt] = useState(null);

  const [historyData, setHistoryData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // all crops for the 3 districts here
  const cropsList = [
    "Cotton", "Wheat", "Sugarcane", "Mango", "Banana",
    "Chilli", "Rice", "Tomato", "Onion", "Guava",
    "Bajra", "Guar", "Moth bean", "Sunflower", "Jowar",
    "Dates", "Desert grasses",
    "None"
  ];

  // crops based on district for filtering
  const districtCrops = {
    "Mirpur Khas": ["Cotton", "Wheat", "Sugarcane", "Mango", "Banana", "Chilli", "Rice", "Tomato", "Onion", "Guava"],
    "Umerkot":     ["Cotton", "Wheat", "Bajra", "Guar", "Moth bean", "Onion", "Chilli", "Sunflower", "Jowar"],
    "Tharparkar":  ["Bajra", "Guar", "Moth bean", "Jowar", "Dates", "Desert grasses", "Wheat"],
  };

  const districtOptions = ["Mirpur Khas", "Umerkot", "Tharparkar"];
  const districtCities = {
    "Mirpur Khas": ["Digri", "Hussain Bakhsh Mari", "Jhuddo", "Kot Ghulam Muhammad", "Mirpur Khas", "Naukot", "Shujabad", "Sindhri", "Tando Jan Muhammad"],
    "Umerkot":     ["Kunri", "Pithoro", "Samaro", "Umerkot"],
    "Tharparkar":  ["Chachro", "Dahli", "Diplo", "Islamkot", "Kaloi", "Mithi", "Nagarparkar"]
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const city = data?.address?.city || data?.address?.county || data?.address?.state_district || "Unknown Region";
            setFormData(prev => ({ 
              ...prev, 
              location: city, 
              lat, 
              lng 
            }));
          } catch (e) {
            setFormData(prev => ({ ...prev, location: "Unknown Region", lat, lng }));
          }
        },
        (err) => {
          console.error("Location denied or error:", err);
          setFormData(prev => ({ ...prev, location: "Unknown Region" }));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation not supported");
      setFormData(prev => ({ ...prev, location: "Unknown Region" }));
    }
  }, []);

  const simulateSensor = () => {
    setFormData(prev => ({
      ...prev,
      nitrogen: Math.floor(Math.random() * (140 - 40) + 40),
      phosphorus: Math.floor(Math.random() * (70 - 20) + 20),
      potassium: Math.floor(Math.random() * (300 - 120) + 120),
      ph: (Math.random() * (8.5 - 6.0) + 6.0).toFixed(1),
      moisture: Math.floor(Math.random() * (40 - 10) + 10)
    }));
  };

  const handleNewTest = () => {
    setFormData(initialFormData);
    setReport(null);
    setStep(1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleConsultation = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, lang }; // sending language to backend too
      const res = await axios.post(`/api/predict`, payload);
      setReport(res.data);
      setStep(3);
    } catch (e) { alert("Assistant AI Offline or Error."); }
    setLoading(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Input. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ur' ? "ur-PK" : lang === 'sd' ? "sd-PK" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      setLoading(true);
      try {
        const res = await axios.post(`/api/parse-speech`, { text });
        setFormData(prev => ({
          ...prev,
          prevCrop: res.data.prevCrop && res.data.prevCrop !== "None" ? res.data.prevCrop : prev.prevCrop,
          plannedCrop: res.data.plannedCrop && res.data.plannedCrop !== "None" ? res.data.plannedCrop : prev.plannedCrop,
          waterSource: res.data.waterSource && res.data.waterSource !== "None" ? res.data.waterSource : prev.waterSource,
        }));
        setStep(2);
      } catch (err) {
        alert("AI could not understand the speech. Please try again or fill manually.");
      }
      setLoading(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // for uploading multiple pictures
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result);
          if (newImages.length === files.length) {
            setDoctorImages(prev => [...prev, ...newImages]);
            setDoctorResult(null);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove) => {
    setDoctorImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const analyzeImage = async () => {
    if (doctorImages.length === 0) return;
    setDoctorLoading(true);
    try {
      // backend needs array of images
      const res = await axios.post(`/api/crop-doctor`, { imagesBase64: doctorImages, lang });
      setDoctorResult(res.data);
    } catch (e) {
      alert("AI Vision is offline or Error.");
    }
    setDoctorLoading(false);
  };

  const speak = async (text) => {
    if (audioLoading || isSpeaking) return;
    if (audioRef.current) audioRef.current.pause();
    
    setAudioLoading(true);
    try {
      const res = await axios.post(`/api/generate-speech`, { text });
      const audio = new Audio(res.data.audioBase64);
      audio.volume = 1.0;
      audioRef.current = audio;
      
      audio.onended = () => { setIsSpeaking(false); setIsPaused(false); };
      audio.play();
      setIsSpeaking(true); setIsPaused(false);
    } catch (err) {
      alert("Failed to generate AI Voice.");
    }
    setAudioLoading(false);
  };

  const togglePause = () => {
    if (!audioRef.current) return;
    if (isPaused) { audioRef.current.play(); setIsPaused(false); } 
    else { audioRef.current.pause(); setIsPaused(true); }
  };

  const skipSpeech = (direction) => {
    if (!audioRef.current) return;
    if (direction === 'backward') audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    else if (direction === 'forward') audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
  };

  const handleTabChange = (tab) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsSpeaking(false); setIsPaused(false);
    setActiveTab(tab);
    if (tab === 'dashboard') fetchHistory();
  };

  const saveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const payload = { ...formData, ...report };
      await axios.post(`/api/save-test`, payload);
      alert("Report saved successfully!");
    } catch (e) { alert("Failed to save report."); }
    setIsSaving(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`/api/history`);
      const formattedData = res.data.map(item => ({
        ...item, displayDate: new Date(item.date).toLocaleDateString(), phNumber: parseFloat(item.ph)
      }));
      setHistoryData(formattedData);
    } catch (e) { console.error("Failed to fetch history"); }
  };

  const fontStyle = lang === 'ur' 
    ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: '2.5' }
    : lang === 'sd'
    ? { fontFamily: "'Noto Sans Arabic', sans-serif", lineHeight: '2.2' }
    : {};

  return (
    <div style={fontStyle} className={`min-h-screen bg-slate-50 pb-10 font-sans ${lang === 'ur' || lang === 'sd' ? 'dir-rtl text-gray-900' : 'text-gray-800'}`}>
      {/* Header */}
      <nav dir="ltr" className="bg-agri-green p-4 text-white shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-black flex items-center gap-2 cursor-pointer" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}} onClick={() => handleTabChange('soil')}>
          <Sprout /> AgriMind
        </h1>
        <div className="flex bg-white/20 rounded-full p-1 w-full md:w-[650px] max-w-full h-12 items-stretch gap-1">
          <button 
            onClick={() => setLang(l => l === 'en' ? 'ur' : l === 'ur' ? 'sd' : 'en')} 
            className="px-4 bg-black/20 text-white hover:bg-black/30 rounded-full font-bold flex gap-2 items-center justify-center transition-all h-full"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: "1" }}
          >
            <Globe size={18}/> <span>{lang.toUpperCase()}</span>
          </button>
          <button onClick={() => handleTabChange('soil')} className={`flex-1 min-w-[100px] flex justify-center items-center px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap h-full ${activeTab === 'soil' ? 'bg-white text-agri-green shadow' : 'text-white hover:bg-white/10'}`}>
            {t('soil_ai')}
          </button>
          <button onClick={() => handleTabChange('doctor')} className={`flex-1 min-w-[125px] flex justify-center items-center gap-1 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap h-full ${activeTab === 'doctor' ? 'bg-white text-agri-green shadow' : 'text-white hover:bg-white/10'}`}>
            <Camera size={16}/> {t('crop_doctor')}
          </button>
          <button onClick={() => handleTabChange('guide')} className={`flex-1 min-w-[110px] flex justify-center items-center gap-1 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap h-full ${activeTab === 'guide' ? 'bg-white text-agri-green shadow' : 'text-white hover:bg-white/10'}`}>
            <Sprout size={16}/> {t('soil_guide')}
          </button>
          <button onClick={() => handleTabChange('dashboard')} className={`flex-1 min-w-[110px] flex justify-center items-center gap-1 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap h-full ${activeTab === 'dashboard' ? 'bg-white text-agri-green shadow' : 'text-white hover:bg-white/10'}`}>
            <History size={16}/> {t('dashboard')}
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4" dir={lang === 'ur' || lang === 'sd' ? 'rtl' : 'ltr'}>
        {/* SOIL DIAGNOSTICS TAB */}
        {activeTab === 'soil' && (
          <>
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-8 px-2" dir="ltr">
              {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                  <div 
                    onClick={() => (num < 3 || report) && setStep(num)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer
                    ${step >= num ? 'bg-agri-green text-white scale-110 shadow-lg' : 'bg-gray-300 text-gray-600'}`}
                  >
                    {num === 1 ? <Activity size={20}/> : num === 2 ? <ClipboardCheck size={20}/> : "AI"}
                  </div>
                  {num < 3 && <div className={`flex-1 h-1 mx-2 ${step > num ? 'bg-agri-green' : 'bg-gray-300'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1: SENSOR DATA */}
            {step === 1 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-agri-green transform transition-all">
                <div className="flex justify-between items-center w-full mb-4 border-b border-gray-100 pb-3">
                  <span className="bg-green-100 text-agri-green px-3 py-1.5 rounded-full text-xs font-black tracking-wider uppercase">{t('probe_status')}</span>
                  {formData.location && (
                    <span className="flex items-center gap-1.5 text-sm font-black text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      📍 {formData.location}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-gray-800 mt-2 mb-4">{t('soil_diagnostics')}</h2>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Soil Sample Source (Origin)</label>
                  <div className="flex gap-2">
                    <select 
                      value={formData.soilSource} 
                      onChange={e => setFormData({...formData, soilSource: e.target.value, soilCity: districtCities[e.target.value][0]})}
                      className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 font-medium focus:ring-2 focus:ring-agri-green outline-none"
                      dir={lang === 'en' ? 'ltr' : 'rtl'}
                    >
                      {districtOptions.map(d => <option key={d} value={d}>{tDistrict(d)}</option>)}
                    </select>
                    <select 
                      value={formData.soilCity} 
                      onChange={e => setFormData({...formData, soilCity: e.target.value})}
                      className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 font-medium focus:ring-2 focus:ring-agri-green outline-none"
                      dir={lang === 'en' ? 'ltr' : 'rtl'}
                    >
                      {districtCities[formData.soilSource].map(c => <option key={c} value={c}>{tCity(c)}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Select where the soil is actually from, regardless of your current GPS location.</p>
                </div>

                <button onClick={simulateSensor} className="w-full bg-blue-50 text-blue-600 border-2 border-dashed border-blue-200 py-4 rounded-2xl font-bold mb-4 hover:bg-blue-100 transition-colors">
                  {t('sync_live')}
                </button>


                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: t('nitrogen'), val: formData.nitrogen, unit: 'mg/kg' },
                    { label: t('phosphorus'), val: formData.phosphorus, unit: 'mg/kg' },
                    { label: t('potassium'), val: formData.potassium, unit: 'mg/kg' },
                    { label: t('ph'), val: formData.ph, unit: 'pH' }
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                      <p className="text-xl font-black text-agri-green" dir="ltr">{s.val || "--"}<span className="text-xs ml-1 text-gray-400 font-normal">{s.unit}</span></p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                    <p className="text-sm font-bold text-blue-800">{t('moisture')}</p>
                    <p className="text-2xl font-black text-blue-600" dir="ltr">{formData.moisture || "--"}%</p>
                  </div>
                </div>

                <button 
                  disabled={!formData.nitrogen}
                  onClick={() => setStep(2)}
                  className="w-full bg-agri-green text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-green-800"
                >
                  {t('analyze_history')} <ArrowRight size={20}/>
                </button>
              </div>
            )}

            {/* STEP 2: FARMER INTERVIEW WITH MASSIVE MIC */}
            {step === 2 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-yellow-500 relative">
                 <button onClick={() => setStep(1)} className="text-gray-400 flex items-center gap-1 mb-2 text-sm font-bold"><ArrowLeft size={16}/> {t('back')}</button>
                 <h2 className="text-2xl font-black text-gray-800 text-center mb-4">{t('field_interview')}</h2>
                 
                 {/* MASSIVE MIC BUTTON FOR FARMERS (REDUCED SIZE) */}
                 <div className="flex flex-col items-center justify-center my-6">
                   <button 
                      onClick={startListening}
                      className={`w-20 h-20 rounded-full flex flex-col justify-center items-center shadow-2xl transition-all duration-300 ease-in-out ${isListening ? 'bg-red-500 scale-110 shadow-red-500/50 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-blue-600/30'} text-white border-4 border-white`}
                   >
                     {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                   </button>
                   <p className={`mt-4 font-black text-lg tracking-wide ${isListening ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                     {isListening ? t('listening') : t('tap_speak')}
                   </p>
                 </div>
                 
                 {/* FORM DROPDOWNS - filtered by district */}
                 {(() => {
                   const availCrops = formData.location && districtCrops[formData.location]
                     ? [...districtCrops[formData.location], "None"]
                     : cropsList;
                   const plantCrops = availCrops.filter(c => c !== "None");
                   
                   const restDurationOptions = [
                     { val: "1 to 3 Weeks (1 se 3 Hafte)", en: "1 to 3 Weeks", ur: "1 سے 3 ہفتے", sd: "1 کان 3 هفتا" },
                     { val: "4 to 8 Weeks (1 se 2 Mahinay)", en: "4 to 8 Weeks", ur: "4 سے 8 ہفتے", sd: "4 کان 8 هفتا" },
                     { val: "3 to 5 Months (3 se 5 Mahinay)", en: "3 to 5 Months", ur: "3 سے 5 مہینے", sd: "3 کان 5 مهينا" },
                     { val: "6+ Months / Barren (6 Mahinay se Zyada / Banjar)", en: "6+ Months (Barren)", ur: "6 مہینے سے زیادہ (بنجر)", sd: "6 مهينن کان مٿي (بنجر)" }
                   ];
                   
                   const stageOptions = [
                     { val: "Seedling (Poda)", en: "Seedling", ur: "پودا", sd: "پودو" },
                     { val: "Vegetative (Bara ho raha hai)", en: "Vegetative", ur: "بڑا ہو رہا ہے", sd: "وڏو ٿي رهيو آهي" },
                     { val: "Flowering (Phool lag rahe hain)", en: "Flowering", ur: "پھول لگ رہے ہیں", sd: "گل لڳي رهيا آهن" },
                     { val: "Fruiting (Phal lag raha hai)", en: "Fruiting", ur: "پھل لگ رہا ہے", sd: "ڦر لڳي رهيو آهي" },
                     { val: "Maturity (Pakk gaya hai)", en: "Maturity", ur: "پک گیا ہے", sd: "پچي ويو آهي" }
                   ];

                   return (
                      <div className="space-y-4 mb-6">
                        <div className="flex bg-green-50/50 p-1.5 rounded-full mb-6 border border-green-100 shadow-inner">
                          <button 
                            onClick={() => setFormData({...formData, testingPhase: "Pre-Sowing"})} 
                            className={`flex-1 py-3 text-sm font-black rounded-full transition-all duration-300 ${formData.testingPhase === "Pre-Sowing" ? 'bg-agri-green text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:text-agri-green hover:bg-green-50'}`}
                          >
                            {t('pre_sowing')}
                          </button>
                          <button 
                            onClick={() => setFormData({...formData, testingPhase: "Growth"})} 
                            className={`flex-1 py-3 text-sm font-black rounded-full transition-all duration-300 ${formData.testingPhase === "Growth" ? 'bg-agri-green text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:text-agri-green hover:bg-green-50'}`}
                          >
                            {t('growth_phase')}
                          </button>
                        </div>
                       {formData.testingPhase === "Pre-Sowing" ? (
                         <>
                           <div className="flex flex-col">
                             <label className="text-sm font-bold text-gray-600 mb-1 ml-1">{t('last_crop')}</label>
                             <select dir={lang === 'en' ? 'ltr' : 'rtl'} className="bg-gray-100 p-4 rounded-xl font-medium outline-none border-2 border-transparent focus:border-agri-green" value={formData.prevCrop} onChange={(e)=>setFormData({...formData, prevCrop: e.target.value})}>
                               {availCrops.map(c => <option key={c} value={c}>{tCrop(c)}</option>)}
                             </select>
                           </div>

                           <div className="flex flex-col">
                             <label className="text-sm font-bold text-gray-600 mb-1 ml-1">{t('rest_duration')}</label>
                             <select dir={lang === 'en' ? 'ltr' : 'rtl'} className="bg-gray-100 p-4 rounded-xl font-medium outline-none border-2 border-transparent focus:border-agri-green" value={formData.restDuration} onChange={(e)=>setFormData({...formData, restDuration: e.target.value})}>
                               {restDurationOptions.map(r => <option key={r.val} value={r.val}>{r[lang]}</option>)}
                             </select>
                           </div>

                           <div className="flex flex-col p-4 bg-green-50 rounded-2xl border border-green-100">
                             <label className="text-sm font-bold text-agri-green mb-1">{t('plant_next')}</label>
                             <select dir={lang === 'en' ? 'ltr' : 'rtl'} className="bg-white p-3 rounded-lg font-bold text-agri-green outline-none ring-1 ring-green-200" value={formData.plannedCrop} onChange={(e)=>setFormData({...formData, plannedCrop: e.target.value})}>
                               {plantCrops.map(c => <option key={c} value={c}>{tCrop(c)}</option>)}
                             </select>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="flex flex-col p-4 bg-green-50 rounded-2xl border border-green-100 mb-4">
                             <label className="text-sm font-bold text-agri-green mb-1">{t('current_crop')}</label>
                             <select dir={lang === 'en' ? 'ltr' : 'rtl'} className="bg-white p-3 rounded-lg font-bold text-agri-green outline-none ring-1 ring-green-200" value={formData.plannedCrop} onChange={(e)=>setFormData({...formData, plannedCrop: e.target.value})}>
                               {plantCrops.map(c => <option key={c} value={c}>{tCrop(c)}</option>)}
                             </select>
                           </div>

                           <div className="flex flex-col">
                             <label className="text-sm font-bold text-gray-600 mb-1 ml-1">{t('crop_stage')}</label>
                             <select dir={lang === 'en' ? 'ltr' : 'rtl'} className="bg-gray-100 p-4 rounded-xl font-medium outline-none border-2 border-transparent focus:border-agri-green" value={formData.stage} onChange={(e)=>setFormData({...formData, stage: e.target.value})}>
                               {stageOptions.map(r => <option key={r.val} value={r.val}>{r[lang]}</option>)}
                             </select>
                           </div>
                         </>
                       )}
                     </div>
                   );
                 })()}

                 <button 
                  onClick={handleConsultation}
                  className="w-full bg-agri-green text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-green-800 transition-all"
                >
                  {loading ? t('generating') : t('gen_prescription')}
                </button>
              </div>
            )}

            {/* STEP 3: FINAL AI REPORT */}
            {step === 3 && report && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                <div className={`p-6 rounded-3xl shadow-xl text-white ${report.status === 'warning' ? 'bg-orange-500' : 'bg-agri-green'}`}>
                  <div className="flex justify-between items-center mb-4 gap-3 relative" dir="ltr">
                    <div>
                      <p className="text-sm opacity-80 font-bold tracking-widest text-white/90" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>{t('ai_decision')}</p>
                      <h1 className="text-4xl font-black" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>{report.decision}</h1>
                    </div>

                    {/* Dynamic Voice Control Bar */}
                    <div className="flex items-center gap-2">
                      {!isSpeaking ? (
                        <button onClick={() => speak(report.speechText || report.diagnosisText)} disabled={audioLoading} className={`bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all shadow-inner ${audioLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {audioLoading ? <RotateCcw className="animate-spin" size={24} /> : <Volume2 size={24} />}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-white/20 p-2 rounded-full shadow-inner animate-in fade-in duration-300">
                          <button onClick={() => skipSpeech('backward')} className="text-white/70 hover:text-white transition-all">
                            <Rewind size={20} />
                          </button>
                          <button onClick={togglePause} className="bg-white text-agri-green p-3 rounded-full hover:bg-white/80 transition-all shadow-md">
                            {isPaused ? <Play size={22} fill="currentColor"/> : <Pause size={22} fill="currentColor"/>}
                          </button>
                          <button onClick={() => skipSpeech('forward')} className="text-white/70 hover:text-white transition-all">
                            <FastForward size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p dir="rtl" className={`font-medium border-r-4 border-white/30 pr-4 py-2 mb-4 bg-black/5 rounded-l-lg ${lang === 'ur' || lang === 'sd' ? 'text-base leading-[3.5rem]' : 'text-lg leading-relaxed'}`}>
                    "{report.diagnosisText}"
                  </p>
                  <div className="bg-black/10 p-3 rounded-xl inline-flex items-center gap-2">
                    <span className="text-lg">⏳</span>
                    <p className="text-sm font-bold">{report.waitTime}</p>
                  </div>
                </div>

                <h3 className="font-black text-gray-700 ml-2 mt-6 uppercase text-sm tracking-wider flex items-center gap-2">
                  {t('expert_alt')} <Sprout size={16}/>
                </h3>
                
                {report.alternatives.map((c, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow hover:border-blue-100 cursor-pointer" onClick={() => setExpandedAlt(expandedAlt === i ? null : i)}>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <h4 className="text-xl font-black text-gray-800" dir="ltr">{c.crop}</h4>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-blue-600 font-bold">{expandedAlt === i ? t('see_less') : t('see_more')}</span>
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shadow-sm"><Sprout /></div>
                      </div>
                    </div>
                    {expandedAlt === i && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                        <p className={`text-gray-700 font-medium ${lang === 'ur' || lang === 'sd' ? 'text-sm leading-[2.8rem]' : 'text-sm leading-relaxed'}`} dir={lang === 'ur' || lang === 'sd' ? 'rtl' : 'ltr'}>{c.why}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 mt-4" dir="ltr">
                  <button onClick={handleNewTest} className="flex-1 bg-gray-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
                    <RotateCcw size={20}/> {t('new_test')}
                  </button>
                  <button onClick={saveReport} disabled={isSaving} className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50">
                    {isSaving ? <RotateCcw className="animate-spin" size={20}/> : <Save size={20}/>}
                    {isSaving ? t('saving') : t('save_db')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* CROP DOCTOR TAB - UPDATED FOR DIRECT CAMERA & MULTIPLE IMAGES */}
        {activeTab === 'doctor' && (
           <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-blue-500 transform transition-all animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-2">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Vision AI Active</span>
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">{t('crop_doctor')}</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">{t('camera_instruction')}</p>
              
              {/* Image Gallery/Grid */}
              {doctorImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {doctorImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img src={img} alt={`Crop ${idx}`} className="w-full h-full object-cover rounded-xl shadow-sm border border-gray-200" />
                      <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold shadow-md">X</button>
                    </div>
                  ))}
                  {/* Add more button */}
                  {doctorImages.length < 5 && (
                    <label className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors aspect-square">
                      <Upload size={24} className="text-gray-400" />
                      <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              )}

              {doctorImages.length === 0 && (
                <label className="w-full flex flex-col items-center justify-center bg-blue-50 text-blue-600 border-2 border-dashed border-blue-200 py-16 rounded-2xl font-bold cursor-pointer hover:bg-blue-100 transition-colors shadow-inner">
                  <Camera size={48} className="mb-4 opacity-80" />
                  <span className="text-xl">{t('upload_photo')}</span>
                  <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
              )}

              {doctorImages.length > 0 && !doctorResult && (
                <button 
                  onClick={analyzeImage} 
                  disabled={doctorLoading}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all mt-4"
                >
                  {doctorLoading ? t('scanning') : t('analyze_disease')}
                </button>
              )}

              {doctorResult && (
                <div className="mt-6 bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-4 animate-in slide-in-from-bottom-4">
                  <div>
                    <p className="text-xs uppercase font-black text-blue-800/60 tracking-wider">{t('disease_detected')}</p>
                    <h3 className="text-xl font-black text-blue-900" dir="ltr">{doctorResult.diseaseName}</h3>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-black text-blue-800/60 tracking-wider">{t('diagnosis')}</p>
                    <p className="text-sm font-medium text-gray-800 italic leading-relaxed">"{doctorResult.diagnosis}"</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-xs uppercase font-black text-green-700 tracking-wider mb-1">{t('treatment')}</p>
                    <p className="text-sm font-bold text-gray-800">{doctorResult.treatment}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full mt-2" dir="ltr">
                    {!isSpeaking ? (
                      <button onClick={() => speak(doctorResult.speechText || (doctorResult.diagnosis + " Iska hal ye hai: " + doctorResult.treatment))} disabled={audioLoading} className={`w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-md hover:bg-blue-700 flex justify-center items-center gap-2 transition-all ${audioLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {audioLoading ? <RotateCcw className="animate-spin" size={20}/> : <Volume2 size={20}/>}
                        {audioLoading ? t('generating') : t('listen_diagnosis')}
                      </button>
                    ) : (
                      <div className="w-full flex justify-center items-center gap-6 bg-blue-100 p-3 rounded-xl shadow-inner animate-in fade-in duration-300">
                        <button onClick={() => skipSpeech('backward')} className="text-blue-500 hover:text-blue-700 transition-all">
                          <Rewind size={24} />
                        </button>
                        <button onClick={togglePause} className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all shadow-md">
                          {isPaused ? <Play size={24} fill="currentColor"/> : <Pause size={24} fill="currentColor"/>}
                        </button>
                        <button onClick={() => skipSpeech('forward')} className="text-blue-500 hover:text-blue-700 transition-all">
                          <FastForward size={24} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
           </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-purple-600 transform transition-all animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2"><History className="text-purple-600"/> {t('history_tracking')}</h2>
            
            {historyData.length === 0 ? (
              <p className="text-gray-500 text-center py-10 font-bold">{t('no_history')}</p>
            ) : (
              <div className="space-y-8" dir="ltr">
                {/* NPK Graph */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-700 mb-4 text-center">Soil Nutrients Trend (NPK)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayDate" tick={{fontSize: 12}} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nitrogen" stroke="#3b82f6" name="N" strokeWidth={3}/>
                        <Line type="monotone" dataKey="phosphorus" stroke="#8b5cf6" name="P" strokeWidth={3}/>
                        <Line type="monotone" dataKey="potassium" stroke="#f59e0b" name="K" strokeWidth={3}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* History List */}
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 uppercase tracking-wider text-xs">{t('recent_tests')}</h3>
                  <div className="space-y-3">
                    {historyData.slice().reverse().map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex justify-between items-center hover:border-purple-300 transition-colors">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{item.displayDate}</p>
                          <p className="text-gray-500 text-xs mt-1">Target: <span className="font-bold text-gray-700">{item.plannedCrop}</span></p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase ${item.decision === 'PROCEED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.decision}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SOIL GUIDE TAB */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-agri-green transform transition-all animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <Sprout className="text-agri-green"/> {t('soil_guide')}
            </h2>
            <p className="text-gray-500 text-center py-10 font-bold">Soil Handbook Coming Soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
