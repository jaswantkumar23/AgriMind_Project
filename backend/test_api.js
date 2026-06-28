//this script will react like hardware prob
const testData = {
  n: 90, // Nitrogen
  p: 42, // Phosphorus
  k: 43, // Potassium
  temp: 20.8, // Temperature
  hum: 82.0, // Humidity
  ph: 6.5, // pH value
  rain: 202.9, // Rainfall
};

async function sendTestData() {
  console.log("Sending fake soil data to server...");

  try {
    const response = await fetch("http://localhost:5000/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log("-----------------------------------");
    console.log("AI Recommendation:", result.recommendedCrop);
    console.log("Status:", result.message);
    console.log("-----------------------------------");
  } catch (error) {
    console.error("Error connecting to server:", error.message);
  }
}

sendTestData();
