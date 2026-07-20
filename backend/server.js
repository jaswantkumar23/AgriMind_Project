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
  .then(() => console.log("MongoDB connected Successsfully"))
  .catch((err) => console.log("MongoDB connection error",err));

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

// function to run my python ML model
const runMLModel = (inputData) => {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    
    const pythonProcess = spawn(pythonCmd, ['predict_ml.py'], { cwd: __dirname });
    
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

// Sindh regional soil profiles database
const SINDH_AGRI_KNOWLEDGE = {
  "Mirpur Khas": {
    soilType: "Fertile Alluvial Plain / Clay Loam & Silt Loam",
    waterType: "Canal Irrigated",
    characteristics: "High agricultural yield potential, good moisture retention, suitable for intensive cash cropping.",
    topCrops: ["Cotton", "Wheat", "Sugarcane", "Mango", "Banana", "Chilli", "Rice", "Tomato", "Onion", "Guava"]
  },
  "Umerkot": {
    soilType: "Semi-Arid Transition Plain / Sandy Loam & Loamy",
    waterType: "Partial Canal & Groundwater",
    characteristics: "Moderate organic matter, excellent drainage, famous for high quality chilli and oilseed crops.",
    topCrops: ["Cotton", "Wheat", "Bajra", "Guar", "Moth bean", "Onion", "Chilli", "Sunflower", "Jowar"]
  },
  "Tharparkar": {
    soilType: "Arid Desert Sand & Sandy Loam",
    waterType: "Rain-fed & Deep Brackish Wells",
    characteristics: "Low nitrogen and low organic matter, vulnerable to dry spells, optimal for drought-hardy legumes and fodder.",
    topCrops: ["Bajra", "Guar", "Moth bean", "Jowar", "Dates", "Desert grasses", "Wheat"]
  }
};

// main brain of the app using AI and ML
const generateAIDiagnosis = async (data) => {
  let { nitrogen, phosphorus, potassium, ph, moisture, location, soilSource, soilCity, lat, lng, restDuration, prevCrop, plannedCrop, stage, lang, testingPhase } = data;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend .env");
  }

  const district = soilSource || "Mirpur Khas";
  const city = soilCity || "Mirpur Khas";
  const districtInfo = SINDH_AGRI_KNOWLEDGE[district] || SINDH_AGRI_KNOWLEDGE["Mirpur Khas"];

  // calling weather api for live data based on soilSource
  let weatherContext = "Weather data unavailable.";
  let wLat = 25.396; let wLng = 68.3578; // Default Mirpur Khas
  if (district === "Mirpur Khas") { wLat = 25.5251; wLng = 69.0159; }
  else if (district === "Umerkot") { wLat = 25.3615; wLng = 69.7362; }
  else if (district === "Tharparkar") { wLat = 24.7977; wLng = 69.8058; }
  
  try {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${wLat}&longitude=${wLng}&current_weather=true`);
    const weatherData = await weatherRes.json();
    if (weatherData && weatherData.current_weather) {
      const { temperature, windspeed } = weatherData.current_weather;
      weatherContext = `Current Temperature in ${district} (${city}): ${temperature}°C, Wind Speed: ${windspeed} km/h`;
    }
  } catch (err) {
    console.error("Weather fetch warning:", err.message);
  }

  // calling python ML model for prediction
  let mlPredictionText = "";
  let mlAlternativesText = "";
  let situation = testingPhase || "Pre-Sowing";
  
  try {
    const mlInput = {
      situation: situation,
      District: district,
      Soil_Type: districtInfo.soilType,
      N: nitrogen, P: phosphorus, K: potassium, pH: ph, Moisture: moisture,
      Previous_Crop: prevCrop || "None",
      Current_Crop: plannedCrop || "Cotton",
      Stage: stage || "Vegetative"
    };
    
    console.log("🤖 Running AgriMind ML Engine...");
    const mlResult = await runMLModel(mlInput);
    console.log("🤖 ML Result:", mlResult);
    
    if (mlResult && !mlResult.error) {
      const confidenceStr = mlResult.confidence ? ` (Statistical Confidence: ${mlResult.confidence}%)` : '';
      if (mlResult.type === "crop_recommendation") {
        mlPredictionText = `The AgriMind ML Model mathematically predicts the top recommended crop for this soil sample is: ${mlResult.prediction}${confidenceStr}. Strongly highlight this expert insight from the "AgriMind Assistant".`;
        if (mlResult.alternatives && mlResult.alternatives.length > 0) {
          mlAlternativesText = `CRITICAL: The ML model selected these top alternative crops based on highest probability: ${mlResult.alternatives.join(", ")}. Use these crops for the 'alternatives' list.`;
        }
      } else {
        mlPredictionText = `The AgriMind ML Model mathematically recommends this fertilizer action: ${mlResult.prediction}${confidenceStr}. Advise the farmer accordingly.`;
      }
    } else {
      console.warn("ML Model returned warning/error:", mlResult?.error);
    }
  } catch (err) {
    console.error("ML Model execution fallback to Gemini logic:", err.message);
  }

  let languageInstruction = "You MUST respond in pure, standard Pakistani Urdu (Urdu Script). AVOID formal Hindi words or Roman script in text.";
  let greeting = "'السلام علیکم بھائی!'";
  
  if (lang === 'sd') {
    languageInstruction = "You MUST respond in pure, standard Sindhi language (Sindhi Script). Talk like a warm, experienced local Sindhi agricultural expert.";
    greeting = "'اسلام عليڪم ڀاءُ!'";
  }

  const prompt = `
    Act as an expert agronomist AI assistant in Pakistan specializing in Sindh soils.
    CRITICAL LANGUAGE REQUIREMENT: ${languageInstruction}
    
    HARDWARE SENSOR & CROP CONTEXT:
    - City/Tehsil: ${city}, District: ${district}
    - Regional Agronomy Profile: Soil Type is "${districtInfo.soilType}" (${districtInfo.characteristics})
    - Live Probe Data: Nitrogen: ${nitrogen} mg/kg, Phosphorus: ${phosphorus} mg/kg, Potassium: ${potassium} mg/kg, pH: ${ph}, Moisture: ${moisture}%
    - Farming Phase: ${situation}
    - Time Since Last Crop: ${restDuration || "Not Specified"}
    - Previous Harvested Crop: ${prevCrop}
    - Farmer's Planned Target Crop: ${plannedCrop}
    - Live Weather Context: ${weatherContext}
    
    AGRIMIND ML MODEL INSIGHT:
    ${mlPredictionText || "ML prediction fallback to agronomic heuristic analysis."}
    
    EXPERT ANALYSIS REQUIREMENTS:
    1. First, mention the soil context of ${city}, ${district} (${districtInfo.soilType}).
    2. Compare the live N-P-K, pH, and Moisture against ideal target requirements for "${plannedCrop}". Detail any deficits or excesses explicitly (e.g., Nitrogen needed vs actual).
    3. Prescribe specific fertilizer dosage or soil treatment to fix any nutrient gaps. Factor in land rest duration ("${restDuration}").
    4. Explicitly weave in the AgriMind Assistant ML insight (${mlPredictionText}).
    
    ${mlAlternativesText || 'Provide 3 to 4 recommended alternative crops in the "alternatives" array that naturally thrive in this soil condition without excessive chemical fertilizers.'}
    
    OUTPUT FORMAT: Return STRICT JSON ONLY (no markdown backticks, no markdown fence):
    {
      "decision": "PROCEED" or "STOP & WAIT",
      "diagnosisText": "Friendly, detailed advice script starting with ${greeting}. Explain soil condition, NPK balance for ${plannedCrop}, precise fertilizer actions, and AgriMind Assistant insight. DO NOT list alternative crops in this text. Write numbers and units naturally in the output script (e.g. 'ملی گرام فی کلوگرام').",
      "speechText": "The EXACT SAME script transliterated into Devanagari (Hindi) script for TTS voice synthesis.",
      "waitTime": "Action timeline (e.g., 'Plant within 7 days' or 'Wait 3 weeks') in requested language.",
      "status": "success" (for proceed) or "warning" (for stop),
      "alternatives": [
        { "crop": "Crop Name", "why": "Detailed agronomic explanation why this crop fits current soil NPK." }
      ]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  let rawText = response.text || "";
  let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (parseErr) {
    console.error("JSON parse retry formatting...", parseErr.message);
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw parseErr;
  }
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

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.json({
        prevCrop: "None",
        plannedCrop: "Cotton",
        restDuration: "1 to 3 Weeks (1 se 3 Hafte)"
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      The following text is transcribed speech from a Pakistani farmer in Sindh (Urdu, Sindhi, Seraiki, or English/Roman).
      Extract their farming context accurately:
      1. "prevCrop": The crop previously harvested. Options: ["Wheat", "Cotton", "Sugarcane", "Rice", "Mango", "Banana", "Guava", "Onion", "Tomato", "Chilli", "Okra", "Brinjal", "Spinach", "Bottle gourd", "Mash", "Moong", "Masoor", "Berseem", "Lucerne", "Jowar", "Bajra", "Guar", "Moth bean", "Sunflower", "Cabbage", "Cauliflower", "Cluster beans", "Desert grasses", "Local seasonal sabzi", "Local fodder", "None"]. Default "None".
      2. "plannedCrop": Next target crop. Same options as above (excluding "None"). Default "Cotton".
      3. "restDuration": Time land has rested. Options: ["Currently Growing (Fasal Lagi Hai)", "1 to 3 Weeks (1 se 3 Hafte)", "4 to 8 Weeks (1 se 2 Mahinay)", "3 to 5 Months (3 se 5 Mahinay)", "6+ Months / Barren (6 Mahinay se Zyada / Banjar)"]. Default "1 to 3 Weeks (1 se 3 Hafte)".
      
      Farmer Speech Transcribe: "${text}"
      
      STRICT JSON ONLY:
      {
        "prevCrop": "...",
        "plannedCrop": "...",
        "restDuration": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let rawText = response.text || "";
    let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      res.json(JSON.parse(cleanText));
    } catch (parseErr) {
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) res.json(JSON.parse(match[0]));
      else throw parseErr;
    }
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
    
    const imageParts = imagesBase64.map(imgBase64 => {
      const parts = imgBase64.split(";base64,");
      const mimeType = parts[0].replace("data:", "") || "image/jpeg";
      const base64Data = parts[1] || imgBase64;
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    });

    let languageInstruction = "Use clear Pakistani Urdu script (Urdu font). AVOID formal Hindi or Roman Urdu.";
    if (lang === 'sd') {
      languageInstruction = "Use clear Sindhi script (Sindhi font). Speak like an experienced Sindhi agronomist.";
    }

    const prompt = `
      Act as an expert plant pathologist and agronomist for Sindh agriculture.
      Examine the uploaded leaf / plant image(s).
      Detect any plant disease, insect pest damage (e.g., Whitefly, Aphids, Thrips, Leaf Miner), or nutrient deficiency (Chlorosis, Necrosis).
      
      REQUIREMENTS:
      1. ${languageInstruction}
      2. If the image is NOT a crop/plant, or is completely dark/unreadable, set "isValidImage": false and specify the warning.
      3. For valid images, prescribe both an organic remedy (e.g., neem oil spray, wood ash) and local chemical treatment (e.g., Imidacloprid, Copper Oxychloride, Sulphur spray) readily accessible in Sindh markets.
      
      STRICT JSON ONLY:
      {
        "isValidImage": true,
        "diseaseName": "Crop Name & Identified Disease/Pest in requested language",
        "diagnosis": "Comprehensive symptom breakdown in requested language",
        "treatment": "Practical, step-by-step organic & chemical treatments in requested language",
        "speechText": "Identical diagnosis and treatment script transliterated into Devanagari (Hindi) script for TTS synthesis."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    let rawText = response.text || "";
    let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      res.json(JSON.parse(cleanText));
    } catch (parseErr) {
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) res.json(JSON.parse(match[0]));
      else throw parseErr;
    }
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
