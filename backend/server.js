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
    // Using default python, user can override via .env
    const pythonCmd = process.env.PYTHON_CMD || 'C:/Users/KS Technologies/AppData/Local/Programs/Python/Python311/python.exe';
    
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

// main brain of the app using AI and ML
const generateAIDiagnosis = async (data) => {
  let { nitrogen, phosphorus, potassium, ph, moisture, location, soilSource, lat, lng, restDuration, prevCrop, plannedCrop, stage, lang, testingPhase } = data;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend .env");
  }
  // calling weather api for live data based on soilSource
  let weatherContext = "Weather data unavailable.";
  let wLat = 25.396; let wLng = 68.3578; // Default Mirpur Khas roughly
  if (soilSource === "Mirpur Khas") { wLat = 25.5251; wLng = 69.0159; }
  else if (soilSource === "Umerkot") { wLat = 25.3615; wLng = 69.7362; }
  else if (soilSource === "Tharparkar") { wLat = 24.7977; wLng = 69.8058; }
  
  try {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${wLat}&longitude=${wLng}&current_weather=true`);
    const weatherData = await weatherRes.json();
    if (weatherData && weatherData.current_weather) {
      const { temperature, windspeed } = weatherData.current_weather;
      weatherContext = `Current Temperature in ${soilSource}: ${temperature}°C, Wind Speed: ${windspeed} km/h`;
    }
  } catch (err) {
    console.error("Weather fetch error:", err);
  }

  // calling python for prediction
  let mlPredictionText = "";
  let mlAlternativesText = "";
  let situation = testingPhase || "Pre-Sowing";
  
  try {
    const mlInput = {
      situation: situation,
      District: soilSource || location || "Mirpur Khas",
      N: nitrogen, P: phosphorus, K: potassium, pH: ph, Moisture: moisture,
      Previous_Crop: prevCrop || "None",
      Current_Crop: plannedCrop || "Cotton",
      Stage: stage || "Vegetative"
    };
    
    console.log("🤖 Running ML Model...");
    const mlResult = await runMLModel(mlInput);
    console.log("🤖 ML Result:", mlResult);
    
    if (mlResult.type === "crop_recommendation") {
      mlPredictionText = `The AgriMind ML Model mathematically predicts the #1 best crop is: ${mlResult.prediction}. Make sure to strongly recommend this and explicitly state that this is the recommendation of the "AgriMind Assistant". Speak this naturally in the requested language script (do NOT use Roman Urdu).`;
      if (mlResult.alternatives && mlResult.alternatives.length > 0) {
        mlAlternativesText = `CRITICAL: The ML model strictly selected these alternative crops based on probability: ${mlResult.alternatives.join(", ")}. You MUST ONLY use these exact crops in the 'alternatives' array and explain why they match the current NPK perfectly.`;
      }
    } else {
      mlPredictionText = `The AgriMind ML Model specifically recommends this fertilizer action: ${mlResult.prediction}. Make sure to strongly advise the farmer to do this and explicitly state that this is the recommendation of the "AgriMind Assistant". Speak this naturally in the requested language script (do NOT use Roman Urdu).`;
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
    Soil Sample Source: ${soilSource || "Mirpur Khas"}
    Time Since Last Crop: ${restDuration || "Not Specified"}
    Previous Crop: ${prevCrop}
    Planned Crop: ${plannedCrop}
    Current Weather Context: ${weatherContext}
    
    CRITICAL AGRIMIND ASSISTANT INSIGHT:
    ${mlPredictionText}
    
    CORE COMPARATIVE LOGIC INSTRUCTION:
    1. First, explicitly determine and state the typical soil type (e.g., sandy, loamy, clay) of the "Soil Sample Source" (${soilSource || "Mirpur Khas"}). Base your diagnosis entirely on this soil source, ignoring the GPS Location if they differ.
    2. You are trained on the standard ideal NPK, pH, and Moisture ranges for all crops in ${soilSource || "Mirpur Khas"}. 
    
    Provide your advice by following this STRICT structure:
    1. FIRST (Compare Planned Crop): Start by mentioning the soil type of ${soilSource || "Mirpur Khas"}. Then compare the live probe data against the standard ideal requirements for the farmer's "Planned Crop" (${plannedCrop}) in that district. Explicitly mention the numbers. For example: "Achi Chilli ke liye N 80mg/kg chahiye jabke aap ki zameen mein 40mg/kg hai." If there is a deficiency or imbalance, prescribe the EXACT fertilizer to fix it. Factor in the "Time Since Last Crop" (${restDuration}).
    2. SECOND (AgriMind ML Insight): Gently introduce the "CRITICAL AGRIMIND ASSISTANT INSIGHT" (${mlPredictionText}). Present this as a highly recommended expert option.
    
    ${mlAlternativesText || 'CRITICAL INSTRUCTION: You MUST ALWAYS provide 3 to 4 "Top Priority Alternative Crops" in the "alternatives" array. Look at the CURRENT probe values and suggest crops that naturally thrive perfectly in these exact soil conditions without needing much extra fertilizer.'}
    
    Respond STRICTLY in JSON format matching this schema exactly (no markdown blocks around it):
    {
      "decision": "PROCEED" or "STOP & WAIT",
      "diagnosisText": "An extremely warm, friendly conversational script. Start with ${greeting}. Act as the smart comparative engine explaining the exact numbers and requirements for ${plannedCrop}, prescribing specific fertilizer fixes, and mentioning the AgriMind insight. IMPORTANT: Spell out the units in the requested language (e.g., write 'ملی گرام فی کلوگرام' instead of 'mg/kg'). DO NOT use English symbols. NEVER use 'Machine Learning', always use 'AgriMind Assistant'.",
      "speechText": "The EXACT SAME script but transliterated purely into Devanagari (Hindi) script for TTS.",
      "waitTime": "e.g., 'Plant immediately' or 'Wait 4 weeks' in the requested language.",
      "status": "success" (if proceed) or "warning" (if stop),
      "alternatives": [
        { "crop": "CropName (in requested language)", "why": "A highly detailed paragraph explaining exactly why this alternative crop is a perfect match for the CURRENT soil NPK/pH without extra fertilizer." }
      ]
    }
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite', // using flash-lite to avoid 503 downtime
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

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
