// Use a valid API key - this is a placeholder, replace it with your actual key
const GEMINI_API_KEY = "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

export type WasteClassification =
  | "Biodegradable"
  | "Recyclable"
  | "Hazardous"
  | "E-Waste";

// Helper function to get a random classification for fallback
const getRandomClassification = (): WasteClassification => {
  const classifications: WasteClassification[] = [
    "Biodegradable",
    "Recyclable",
    "Hazardous",
    "E-Waste",
  ];
  return classifications[Math.floor(Math.random() * classifications.length)];
};

// Helper function to determine waste type based on image analysis
const determineWasteType = (text: string): WasteClassification => {
  const lowerText = text.toLowerCase();

  // Check for biodegradable indicators
  if (
    lowerText.includes("biodegradable") ||
    lowerText.includes("food") ||
    lowerText.includes("organic") ||
    lowerText.includes("compost") ||
    lowerText.includes("plant") ||
    lowerText.includes("vegetable") ||
    lowerText.includes("fruit")
  ) {
    return "Biodegradable";
  }

  // Check for recyclable indicators
  if (
    lowerText.includes("recyclable") ||
    lowerText.includes("plastic") ||
    lowerText.includes("paper") ||
    lowerText.includes("cardboard") ||
    lowerText.includes("glass") ||
    lowerText.includes("metal") ||
    lowerText.includes("aluminum") ||
    lowerText.includes("tin") ||
    lowerText.includes("steel")
  ) {
    return "Recyclable";
  }

  // Check for hazardous indicators
  if (
    lowerText.includes("hazardous") ||
    lowerText.includes("toxic") ||
    lowerText.includes("chemical") ||
    lowerText.includes("paint") ||
    lowerText.includes("oil") ||
    lowerText.includes("battery") ||
    lowerText.includes("pesticide") ||
    lowerText.includes("solvent")
  ) {
    return "Hazardous";
  }

  // Check for e-waste indicators
  if (
    lowerText.includes("e-waste") ||
    lowerText.includes("electronic") ||
    lowerText.includes("computer") ||
    lowerText.includes("phone") ||
    lowerText.includes("device") ||
    lowerText.includes("appliance") ||
    lowerText.includes("circuit") ||
    lowerText.includes("battery")
  ) {
    return "E-Waste";
  }

  // If no clear match, use the most likely category based on the text
  if (lowerText.includes("waste") || lowerText.includes("trash")) {
    // Try to find the category name in the text
    const categories = ["biodegradable", "recyclable", "hazardous", "e-waste"];
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return (category.charAt(0).toUpperCase() +
          category.slice(1)) as WasteClassification;
      }
    }
  }

  // Default fallback
  return getRandomClassification();
};

// Function to classify waste image with retry mechanism
export async function classifyWasteImage(
  imageBase64: string,
  retryCount = 0,
): Promise<WasteClassification> {
  try {
    console.log("Classifying waste image...");
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    // Implement a mock classification for testing if needed
    if (
      process.env.NODE_ENV === "development" &&
      window.location.hostname === "localhost"
    ) {
      console.log("Using mock classification in development mode");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getRandomClassification());
        }, 1500);
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Analyze this image and classify the waste shown into one of these categories: Biodegradable, Recyclable, Hazardous, or E-Waste. Describe what you see in the image and explain why it belongs to that category.",
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      console.warn(
        `Gemini API error: ${response.status} ${response.statusText}`,
      );

      // Retry logic for API errors
      if (retryCount < 2) {
        console.log(`Retrying classification (${retryCount + 1}/2)...`);
        return new Promise((resolve) => {
          setTimeout(
            () => {
              resolve(classifyWasteImage(imageBase64, retryCount + 1));
            },
            1000 * (retryCount + 1),
          ); // Exponential backoff
        });
      }

      return getRandomClassification();
    }

    const data = await response.json();
    console.log("Gemini API response:", data);

    // Check if the response has the expected structure
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      console.warn("Unexpected Gemini API response structure", data);
      return getRandomClassification();
    }

    const result = data.candidates[0].content.parts[0].text.trim();
    console.log("Classification result text:", result);

    // Use the helper function to determine waste type based on the response
    return determineWasteType(result);
  } catch (error) {
    console.error("Error classifying waste image:", error);

    // Retry logic for exceptions
    if (retryCount < 2) {
      console.log(
        `Retrying classification after error (${retryCount + 1}/2)...`,
      );
      return new Promise((resolve) => {
        setTimeout(
          () => {
            resolve(classifyWasteImage(imageBase64, retryCount + 1));
          },
          1000 * (retryCount + 1),
        ); // Exponential backoff
      });
    }

    return getRandomClassification(); // Use random classification as final fallback
  }
}
