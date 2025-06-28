import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface AIAnalysisResult {
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  eco_points: number;
  analysis: {
    waste_type: string;
    severity: string;
    environmental_impact: string;
    cleanup_difficulty: string;
    reasoning: string;
  };
}

export const analyzeWasteReport = async (
  imageBase64: string,
  location: { lat: number; lng: number; address: string },
  description?: string
): Promise<AIAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
Analyze this waste/garbage image and provide a comprehensive assessment for a civic waste management system in India.

Context:
- Location: ${location.address} (${location.lat}, ${location.lng})
- Description: ${description || 'No additional description provided'}

Please analyze the image and return a JSON response with the following structure:
{
  "priority_level": "low|medium|high|urgent",
  "eco_points": number (50-200 based on cleanup difficulty and environmental impact),
  "analysis": {
    "waste_type": "description of waste type",
    "severity": "assessment of severity",
    "environmental_impact": "potential environmental impact",
    "cleanup_difficulty": "estimated cleanup difficulty",
    "reasoning": "explanation for priority and points assignment"
  }
}

Priority Guidelines:
- LOW: Minor litter, small amounts of dry waste, easily cleanable
- MEDIUM: Moderate waste accumulation, mixed waste types, standard cleanup
- HIGH: Large waste piles, hazardous materials, blocking pathways
- URGENT: Health hazards, toxic waste, emergency situations, near water bodies/schools/hospitals

Eco Points Guidelines:
- 50-75: Simple cleanup, minimal environmental impact
- 75-100: Standard waste removal, moderate effort required
- 100-150: Complex cleanup, significant environmental benefit
- 150-200: Hazardous/urgent cleanup, major environmental protection

Consider Indian context: monsoon impact, urban density, public health implications.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysis: AIAnalysisResult = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize the response
    if (!['low', 'medium', 'high', 'urgent'].includes(analysis.priority_level)) {
      analysis.priority_level = 'medium';
    }
    
    if (!analysis.eco_points || analysis.eco_points < 50 || analysis.eco_points > 200) {
      analysis.eco_points = 75; // Default value
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing waste report with AI:', error);
    
    // Return default analysis if AI fails
    return {
      priority_level: 'medium',
      eco_points: 75,
      analysis: {
        waste_type: 'General waste',
        severity: 'Moderate',
        environmental_impact: 'Standard cleanup required',
        cleanup_difficulty: 'Medium effort',
        reasoning: 'AI analysis unavailable, using default assessment'
      }
    };
  }
};

export const validateImageForAnalysis = (imageBase64: string): boolean => {
  try {
    // Check if it's a valid base64 image
    const isValidBase64 = /^data:image\/(jpeg|jpg|png|webp);base64,/.test(imageBase64);
    
    // Check file size (max 4MB for Gemini)
    const sizeInBytes = (imageBase64.length * 3) / 4;
    const maxSize = 4 * 1024 * 1024; // 4MB
    
    return isValidBase64 && sizeInBytes <= maxSize;
  } catch (error) {
    console.error('Error validating image:', error);
    return false;
  }
};