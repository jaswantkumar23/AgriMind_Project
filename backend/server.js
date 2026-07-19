const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// setting up middleware here
app.use(cors());
app.use(express.json());

// connecting to mongodb database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Mubarak ho! MongoDB Atlas se connection ho gaya"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// making db schema to save history
const soilTestSchema = new mongoose.Schema({
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  ph: String,
  moisture: Number,
  location: String,
  restDuration: String,
  prevCrop: String,
  plannedCrop: String,
  diagnosisText: String,
  decision: String,
  date: { type: Date, default: Date.now }
});

const SoilTest = mongoose.model("SoilTest", soilTestSchema);

const { GoogleGenAI } = require("@google/genai");

// ============================================================
// PHASE 1.2: District-to-Soil-Type mapping (matches training data)
// ============================================================
const DISTRICT_SOIL_MAP = {
  "Mirpur Khas": "Clay Loam",
  "Umerkot": "Sandy Loam",
  "Tharparkar": "Sandy"
};

// ============================================================
// PHASE 1.3: Full agricultural knowledge base (from generate_soil_data.py)
// These are the EXACT research-backed ideal ranges for each crop per district.
// Gemini will compare the farmer's live probe data against these real values
// instead of hallucinating ranges from its general training.
// ============================================================
const DISTRICT_CROP_DATA = {
  "Mirpur Khas": {
    soilType: "Clay Loam / Alluvial",
    description: "Fertile alluvial plains, canal-irrigated, high agricultural potential",
    crops: {
      "Cotton":    { N: [120, 145], P: [45, 58],  K: [175, 225], pH: [6.8, 7.5], Moisture: [45, 62] },
      "Wheat":     { N: [100, 125], P: [40, 52],  K: [115, 155], pH: [6.5, 7.5], Moisture: [40, 56] },
      "Sugarcane": { N: [175, 225], P: [60, 82],  K: [195, 280], pH: [6.5, 7.5], Moisture: [65, 82] },
      "Mango":     { N: [110, 135], P: [48, 65],  K: [155, 205], pH: [5.8, 7.0], Moisture: [35, 52] },
      "Banana":    { N: [165, 205], P: [68, 92],  K: [215, 285], pH: [6.0, 7.0], Moisture: [70, 86] },
      "Chilli":    { N: [98, 125],  P: [50, 67],  K: [128, 172], pH: [6.0, 7.0], Moisture: [48, 65] },
      "Rice":      { N: [118, 145], P: [44, 62],  K: [108, 145], pH: [5.5, 6.5], Moisture: [80, 96] },
      "Tomato":    { N: [108, 132], P: [55, 72],  K: [158, 205], pH: [6.0, 7.0], Moisture: [55, 70] },
      "Onion":     { N: [108, 132], P: [50, 66],  K: [158, 202], pH: [6.2, 7.0], Moisture: [50, 65] },
      "Guava":     { N: [88, 112],  P: [38, 56],  K: [118, 162], pH: [5.5, 7.0], Moisture: [38, 55] }
    }
  },
  "Umerkot": {
    soilType: "Sandy Loam",
    description: "Semi-arid zone, mixed soils, partially canal-irrigated",
    crops: {
      "Cotton":    { N: [108, 132], P: [38, 52],  K: [155, 205], pH: [7.0, 7.8], Moisture: [38, 55] },
      "Wheat":     { N: [88, 112],  P: [32, 46],  K: [98, 132],  pH: [6.8, 7.6], Moisture: [35, 50] },
      "Bajra":     { N: [78, 102],  P: [28, 44],  K: [78, 122],  pH: [6.5, 8.0], Moisture: [20, 42] },
      "Guar":      { N: [22, 40],   P: [44, 62],  K: [48, 72],   pH: [7.0, 8.5], Moisture: [18, 36] },
      "Moth bean": { N: [18, 35],   P: [32, 50],  K: [38, 62],   pH: [7.0, 8.2], Moisture: [15, 32] },
      "Onion":     { N: [98, 122],  P: [44, 62],  K: [148, 182], pH: [6.5, 7.2], Moisture: [48, 64] },
      "Chilli":    { N: [88, 112],  P: [44, 62],  K: [118, 158], pH: [6.5, 7.5], Moisture: [44, 60] },
      "Sunflower": { N: [82, 112],  P: [38, 55],  K: [108, 152], pH: [6.5, 7.5], Moisture: [38, 55] },
      "Jowar":     { N: [78, 108],  P: [28, 44],  K: [58, 92],   pH: [6.5, 8.0], Moisture: [22, 45] }
    }
  },
  "Tharparkar": {
    soilType: "Sandy / Desert Sand",
    description: "Arid desert zone, rain-fed farming, low organic matter soils",
    crops: {
      "Bajra":          { N: [55, 80],  P: [18, 35], K: [48, 82],   pH: [7.5, 8.5], Moisture: [10, 28] },
      "Guar":           { N: [12, 28],  P: [28, 45], K: [32, 55],   pH: [7.5, 9.0], Moisture: [10, 22] },
      "Moth bean":      { N: [12, 28],  P: [22, 38], K: [28, 50],   pH: [7.5, 8.8], Moisture: [8, 22] },
      "Jowar":          { N: [52, 78],  P: [18, 35], K: [38, 68],   pH: [7.0, 8.5], Moisture: [10, 28] },
      "Dates":          { N: [88, 122], P: [52, 75], K: [98, 145],  pH: [7.5, 8.5], Moisture: [8, 22] },
      "Desert grasses": { N: [8, 22],   P: [8, 20],  K: [18, 35],   pH: [7.5, 9.2], Moisture: [4, 16] },
      "Wheat":          { N: [68, 92],  P: [22, 40], K: [78, 112],  pH: [7.0, 8.2], Moisture: [28, 45] }
    }
  }
};

// ============================================================
// PHASE 1.4: Input validation helper
// Clamps sensor values to realistic agricultural ranges
// ============================================================
const validateAndClampInputs = (data) => {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, Number(val) || 0));
  return {
    ...data,
    nitrogen: clamp(data.nitrogen, 0, 320),
    phosphorus: clamp(data.phosphorus, 0, 160),
    potassium: clamp(data.potassium, 0, 420),
    ph: clamp(data.ph, 4.5, 9.5),
    moisture: clamp(data.moisture, 0, 100)
  };
};

// function to run my python ML model
const runMLModel = (inputData) => {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    // Using default python, user can override via .env
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    
    const pythonProcess = spawn(pythonCmd, ['predict_ml.py']);
    
    let resultData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python Error: ${errorData}`));
      }
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject(new Error(`Failed to parse ML response: ${resultData}`));
      }
    });

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
};

// retry helper: retries on 503 with exponential backoff, falls back to other models
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const is503Error = (err) => {
  // handles all possible ways the 503 can appear in the google genai sdk
  if (!err) return false;
  if (err.status === 503) return true;
  if (typeof err.status === 'string' && err.status === '503') return true;
  if (err.message && err.message.includes('503')) return true;
  if (err.message && err.message.toLowerCase().includes('unavailable')) return true;
  if (err.message && err.message.toLowerCase().includes('high demand')) return true;
  try {
    const parsed = JSON.parse(err.message);
    if (parsed?.error?.code === 503) return true;
    if (parsed?.error?.status === 'UNAVAILABLE') return true;
  } catch (_) {}
  return false;
};

const generateWithRetry = async (ai, contents, config = {}, maxRetries = 4) => {
  for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
    const model = GEMINI_MODELS[modelIndex];
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying model: ${model} (attempt ${attempt}/${maxRetries})`);
        const response = await ai.models.generateContent({ model, contents, config });
        console.log(`✅ Success with model: ${model}`);
        return response;
      } catch (err) {
        const busy = is503Error(err);
        const isLastAttempt = attempt === maxRetries;
        const isLastModel = modelIndex === GEMINI_MODELS.length - 1;

        if (busy && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1500; // 3s, 6s, 12s, 24s
          console.warn(`⚠️ Model ${model} is busy. Retrying in ${delay / 1000}s... [attempt ${attempt}/${maxRetries}]`);
          await new Promise(r => setTimeout(r, delay));
        } else if (busy && isLastAttempt && !isLastModel) {
          console.warn(`⚠️ Model ${model} exhausted all retries. Switching to next model...`);
          break; // try next model
        } else if (busy && isLastAttempt && isLastModel) {
          throw new Error('All Gemini models are currently busy. Please try again in a few minutes.');
        } else {
          throw err; // non-503 error — bubble up immediately
        }
      }
    }
  }
  throw new Error('All Gemini models are currently busy. Please try again in a few minutes.');
};

// main brain of the app using AI and ML
const generateAIDiagnosis = async (data) => {
  // PHASE 1.4: Validate and clamp inputs before processing
  data = validateAndClampInputs(data);
  let { nitrogen, phosphorus, potassium, ph, moisture, location, soilSource, lat, lng, restDuration, prevCrop, plannedCrop, stage, lang } = data;

  // Default district
  const district = soilSource || location || "Mirpur Khas";

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend .env");
  }

  // PHASE 1.1: Use farmer's actual GPS for weather (fallback to Mirpur Khas center)
  let weatherContext = "Weather data unavailable.";
  try {
    const weatherLat = lat || 25.396;
    const weatherLng = lng || 68.3578;
    console.log(`🌤️ Fetching weather for GPS: ${weatherLat}, ${weatherLng}`);
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLng}&current_weather=true`);
    const weatherData = await weatherRes.json();
    if (weatherData && weatherData.current_weather) {
      const { temperature, windspeed } = weatherData.current_weather;
      weatherContext = `Current Temperature: ${temperature}°C, Wind Speed: ${windspeed} km/h (measured at farmer's actual location: ${weatherLat.toFixed(3)}, ${weatherLng.toFixed(3)})`;
    }
  } catch (err) {
    console.error("Weather fetch error:", err);
  }

  // calling python for prediction
  let mlPredictionText = "";
  let situation = restDuration && restDuration.includes("Currently Growing") ? "Growth" : "Pre-Sowing";
  
  try {
    // PHASE 1.2: Include correct Soil_Type from district mapping
    const mlInput = {
      situation: situation,
      District: district,
      Soil_Type: DISTRICT_SOIL_MAP[district] || "Loamy",
      N: nitrogen, P: phosphorus, K: potassium, pH: ph, Moisture: moisture,
      Previous_Crop: prevCrop || "None",
      Current_Crop: plannedCrop || "Cotton",
      Stage: stage || "Vegetative"
    };
    
    console.log("🤖 Running ML Model with Soil_Type:", mlInput.Soil_Type);
    const mlResult = await runMLModel(mlInput);
    console.log("🤖 ML Result:", mlResult);
    
    if (mlResult.type === "crop_recommendation") {
      mlPredictionText = `The AgriMind Assistant specifically recommends planting: ${mlResult.prediction}. Make sure to include this in your diagnosis and say "AgriMind Assistant ne mashwara diya hai"!`;
    } else {
      mlPredictionText = `The AgriMind Assistant specifically recommends this fertilizer action: ${mlResult.prediction}. Make sure to strongly advise the farmer to do this and say "AgriMind Assistant ne mashwara diya hai"!`;
    }
  } catch (err) {
    console.error("ML Model failed, relying only on Gemini:", err.message);
  }

  let languageInstruction = "You MUST respond in pure, standard Pakistani Urdu (Urdu Script). DO NOT use Punjabi or Sindhi words. Use local agricultural vocabulary (e.g., 'Fasal' for crop, 'Khaad' for fertilizer, 'Zameen' for soil, 'Kisan' for farmer). AVOID formal Hindi words.";
  let greeting = "'السلام علیکم بھائی!'";
  
  if (lang === 'sd') {
    languageInstruction = "You MUST respond in pure, standard Sindhi language (Sindhi Script). DO NOT use Urdu or Punjabi. Talk like a friendly Sindhi local advisor.";
    greeting = "'اسلام عليڪم ڀاءُ!'";
  }

  // PHASE 1.3: Build the knowledge base reference table for this district
  const districtData = DISTRICT_CROP_DATA[district] || DISTRICT_CROP_DATA["Mirpur Khas"];
  let knowledgeBaseText = `\n=== VERIFIED AGRONOMIC REFERENCE DATA FOR ${district.toUpperCase()} ===\n`;
  knowledgeBaseText += `District Soil Type: ${districtData.soilType}\n`;
  knowledgeBaseText += `District Profile: ${districtData.description}\n\n`;
  knowledgeBaseText += `IDEAL RANGES FOR ALL CROPS IN ${district.toUpperCase()} (use THESE numbers, do NOT guess):\n`;
  
  for (const [cropName, ranges] of Object.entries(districtData.crops)) {
    knowledgeBaseText += `  ${cropName}: N=[${ranges.N[0]}-${ranges.N[1]}] mg/kg, P=[${ranges.P[0]}-${ranges.P[1]}] mg/kg, K=[${ranges.K[0]}-${ranges.K[1]}] mg/kg, pH=[${ranges.pH[0]}-${ranges.pH[1]}], Moisture=[${ranges.Moisture[0]}-${ranges.Moisture[1]}]%\n`;
  }
  knowledgeBaseText += `=== END OF REFERENCE DATA ===\n`;

  const prompt = `
    Act as an expert agricultural AI assistant in Pakistan.
    CRITICAL INSTRUCTION: ${languageInstruction}
    
    Here is the live hardware probe data and crop context:
    Nitrogen: ${nitrogen} mg/kg
    Phosphorus: ${phosphorus} mg/kg
    Potassium: ${potassium} mg/kg
    pH: ${ph}
    Moisture: ${moisture}%
    GPS Location: ${location || "Unknown"}
    Soil Sample Source: ${district}
    Time Since Last Crop: ${restDuration || "Not Specified"}
    Previous Crop: ${prevCrop}
    Planned Crop: ${plannedCrop}
    Current Weather Context: ${weatherContext}
    
    CRITICAL AGRIMIND ASSISTANT INSIGHT:
    ${mlPredictionText}
    
    ${knowledgeBaseText}
    
    CORE COMPARATIVE LOGIC INSTRUCTION:
    1. First, explicitly state the soil type of "${district}" which is "${districtData.soilType}" (DO NOT guess, use the reference data above). Base your diagnosis entirely on this soil source, ignoring the GPS Location if they differ.
    2. Use ONLY the "VERIFIED AGRONOMIC REFERENCE DATA" table above to determine ideal NPK, pH, and Moisture ranges for each crop. DO NOT use any other source or general knowledge. Compare the farmer's LIVE probe readings against the EXACT ideal ranges listed above.
    
    Provide your advice by following this STRICT structure:
    1. FIRST (Compare Planned Crop): Start by mentioning the soil type of ${district} ("${districtData.soilType}"). Then compare the live probe data against the ideal requirements for "${plannedCrop}" from the reference data above. Explicitly mention BOTH the farmer's actual reading AND the ideal range. For example: "Achi Chilli ke liye N 98-125 mg/kg chahiye jabke aap ki zameen mein 40mg/kg hai — yeh bahut kam hai." If there is a deficiency or imbalance, prescribe the EXACT fertilizer to fix it. Factor in the "Time Since Last Crop" (${restDuration}).
    2. SECOND (AgriMind ML Insight): Gently introduce the "CRITICAL AGRIMIND ASSISTANT INSIGHT" (${mlPredictionText}). Present this as a highly recommended expert option.
    
    CRITICAL INSTRUCTION: You MUST ALWAYS provide 3 to 4 "Top Priority Alternative Crops" in the "alternatives" array. Look at the CURRENT probe values (N=${nitrogen}, P=${phosphorus}, K=${potassium}, pH=${ph}, Moisture=${moisture}%) and use the reference data table to find crops whose ideal ranges best match these current values WITHOUT needing much extra fertilizer. Put the AgriMind Assistant's recommended crop here too if it fits.
    
    Respond STRICTLY in JSON format matching this schema exactly (no markdown blocks around it):
    {
      "decision": "PROCEED" or "STOP & WAIT",
      "diagnosisText": "An extremely warm, friendly conversational script. Start with ${greeting}. Act as the smart comparative engine explaining the exact numbers and requirements for ${plannedCrop}, prescribing specific fertilizer fixes, and mentioning the AgriMind insight. IMPORTANT: Spell out the units in the requested language (e.g., write 'ملی گرام فی کلوگرام' instead of 'mg/kg'). DO NOT use English symbols. NEVER use 'Machine Learning', always use 'AgriMind Assistant'.",
      "speechText": "The EXACT SAME script but transliterated purely into Devanagari (Hindi) script for TTS.",
      "waitTime": "e.g., 'Plant immediately' or 'Wait 4 weeks' in the requested language.",
      "status": "success" (if proceed) or "warning" (if stop),
      "alternatives": [
        { "crop": "CropName (in requested language)", "why": "A highly detailed paragraph explaining exactly why this alternative crop is a perfect match for the CURRENT soil NPK/pH without extra fertilizer. Reference the specific ideal ranges from the reference data." }
      ]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await generateWithRetry(ai, prompt, { responseMimeType: "application/json" });

  let cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanText);
};

// main api route where the process starts
app.post("/api/predict", async (req, res) => {
  try {
    console.log("📥 Data Received:", req.body);
    const result = await generateAIDiagnosis(req.body);
    res.json(result);
  } catch (err) {
    console.error("❌ Logic Error:", err);
    res.status(500).json({ error: "Internal Server Error. Check GEMINI_API_KEY or model." });
  }
});

// route to understand farmers voice from mic
app.post("/api/parse-speech", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      The following text is transcribed speech from a Pakistani farmer. The speech might be in Sindhi, Urdu, or English (Roman or Arabic script).
      They are talking about their farming plans.
      Extract the following 3 fields. (Translate their Sindhi/Urdu crop names into the English options below):
      1. "prevCrop": The crop they previously harvested. Options: ["Wheat", "Cotton", "Sugarcane", "Rice", "Mango", "Banana", "Guava", "Onion", "Tomato", "Chilli", "Okra", "Brinjal", "Spinach", "Bottle gourd", "Mash", "Moong", "Masoor", "Berseem", "Lucerne", "Jowar", "Bajra", "Guar", "Moth bean", "Sunflower", "Cabbage", "Cauliflower", "Cluster beans", "Desert grasses", "Local seasonal sabzi", "Local fodder", "None"]. If not mentioned or unclear, use "None".
      2. "plannedCrop": The crop they want to plant next. Options: same as above but excluding "None". Default to "Cotton" if unclear.
      3. "restDuration": Approximately how much time has passed since their last crop or how long the land has been resting. Map their speech to the closest matching option below:
         Options: ["Currently Growing (Fasal Lagi Hai)", "1 to 3 Weeks (1 se 3 Hafte)", "4 to 8 Weeks (1 se 2 Mahinay)", "3 to 5 Months (3 se 5 Mahinay)", "6+ Months / Barren (6 Mahinay se Zyada / Banjar)"]. Default to "1 to 3 Weeks (1 se 3 Hafte)" if unclear.
      
      Farmer's Speech: "${text}"
      
      Respond STRICTLY in JSON:
      {
        "prevCrop": "...",
        "plannedCrop": "...",
        "restDuration": "..."
      }
    `;

    const response = await generateWithRetry(ai, prompt, { responseMimeType: "application/json" });

    let cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleanText));
  } catch (err) {
    console.error("❌ Speech Parsing Error:", err);
    res.status(500).json({ error: "Failed to parse speech." });
  }
});

// crop doctor feature for image checking
app.post("/api/crop-doctor", async (req, res) => {
  try {
    const { imagesBase64, lang } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
    }

    if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return res.status(400).json({ error: "No images provided." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare all uploaded images for Gemini
    const imageParts = imagesBase64.map(imgBase64 => {
      return {
        inlineData: {
          data: imgBase64.split(",")[1],
          mimeType: imgBase64.split(";")[0].split(":")[1]
        }
      };
    });

    let languageInstruction = "You MUST use simple, everyday standard Pakistani Urdu. DO NOT use Punjabi or Sindhi words. AVOID pure Hindi words. Provide all textual information to the farmer in proper Urdu script (Urdu font).";
    if (lang === 'sd') {
      languageInstruction = "You MUST use pure, standard Sindhi language (Sindhi Script). Provide all textual information to the farmer in proper Sindhi script.";
    }

    const prompt = `
      Act as an expert plant pathologist and agronomist in Pakistan.
      I have provided one or more images of crops or leaves.
      MOST LIKELY, these are different angles or different leaves of the EXACT SAME plant to help you make a more accurate diagnosis.
      Analyze ALL provided images together to form a highly accurate, single combined conclusion about the plant's health.
      Detect any diseases, pests, or nutrient deficiencies visible across the images.
      (However, if you notice the images are clearly of completely different plants, identify each of them and their respective diseases).
      Provide a comprehensive, combined diagnosis and solution (pesticide/organic treatment) covering the issues found.
      
      CRITICAL INSTRUCTION 1: ${languageInstruction}
      CRITICAL INSTRUCTION 2: If the images are too blurry, too dark, or do NOT show any recognizable plant or crop, DO NOT guess or assume anything. Set "isValidImage" to false.

      Respond STRICTLY with valid JSON.
      Format:
      {
        "isValidImage": true or false,
        "diseaseName": "Names of the crops and their diseases in requested language (e.g. 'Mango: Healthy, Cotton: Leaf Curl'). Leave empty if isValidImage is false.",
        "diagnosis": "Detailed explanation covering all uploaded images in requested language. If isValidImage is false, put the warning message here explaining why (e.g. 'This is not a plant' or 'The image is too blurry, please upload a clearer one').",
        "treatment": "Actionable treatments for all identified issues in requested language. Leave empty if isValidImage is false.",
        "speechText": "The EXACT SAME diagnosis and treatment but transliterated into Devanagari (Hindi) script for TTS."
      }
    `;

    const response = await generateWithRetry(ai,
      [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
      { responseMimeType: "application/json" }
    );

    let cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleanText));
  } catch (err) {
    console.error("❌ Crop Doctor Error:", err);
    res.status(500).json({ error: "Failed to analyze image." });
  }
});

// converting ai text to voice using elevenlabs
app.post("/api/generate-speech", async (req, res) => {
  try {
    const { text } = req.body;
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: "ELEVENLABS_API_KEY is not set." });
    }

    const voiceId = "cgSgspJ2msm6clMCkdW9"; // Jessica voice (Playful, Bright, Warm, Friendly)
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs Error: ${errorData}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    res.json({ audioBase64: `data:audio/mp3;base64,${base64Audio}` });
  } catch (err) {
    console.error("❌ Speech Generation Error:", err);
    res.status(500).json({ error: "Failed to generate speech." });
  }
});


// route to save history in database
app.post("/api/save-test", async (req, res) => {
  try {
    const testData = req.body;
    const newTest = new SoilTest(testData);
    await newTest.save();
    res.status(201).json({ message: "Report saved successfully!", data: newTest });
  } catch (err) {
    console.error("❌ Save Test Error:", err);
    res.status(500).json({ error: "Failed to save test." });
  }
});

// route to fetch history for dashboard graph
app.get("/api/history", async (req, res) => {
  try {
    // Fetch all tests sorted by date (oldest to newest for charting)
    const history = await SoilTest.find().sort({ date: 1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Fetch History Error:", err);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

// 5. Status Check
app.get("/", (req, res) => {
  res.send("AgriMind Backend is Running!");
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Server is running on port: ${PORT}`);
});
