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

// Fixed scoring logic based on priority levels
const getEcoPointsByPriority = (priority: string): number => {
  switch (priority.toLowerCase()) {
    case 'low': return 10;
    case 'medium': return 20;
    case 'high': return 30;
    case 'urgent': return 40;
    default: return 20; // Default to medium
  }
};

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
  "analysis": {
    "waste_type": "description of waste type",
    "severity": "assessment of severity",
    "environmental_impact": "potential environmental impact",
    "cleanup_difficulty": "estimated cleanup difficulty",
    "reasoning": "explanation for priority assignment"
  }
}

Priority Guidelines (STRICT CLASSIFICATION):
- LOW: Minor litter, small amounts of dry waste, easily cleanable, minimal environmental impact
- MEDIUM: Moderate waste accumulation, mixed waste types, standard cleanup effort required
- HIGH: Large waste piles, hazardous materials, blocking pathways, significant environmental concern
- URGENT: Health hazards, toxic waste, emergency situations, near water bodies/schools/hospitals, immediate action required

IMPORTANT: Do NOT include eco_points in your response. Points will be calculated automatically based on priority level:
- Low priority = 10 points
- Medium priority = 20 points  
- High priority = 30 points
- Urgent priority = 40 points

Consider Indian context: monsoon impact, urban density, public health implications.
Focus on accurate priority classification as points are automatically assigned.
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

    const aiResponse = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize the priority level
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const priority = validPriorities.includes(aiResponse.priority_level?.toLowerCase()) 
      ? aiResponse.priority_level.toLowerCase() 
      : 'medium';

    // Calculate eco points based on priority (FIXED LOGIC)
    const ecoPoints = getEcoPointsByPriority(priority);

    const analysis: AIAnalysisResult = {
      priority_level: priority as 'low' | 'medium' | 'high' | 'urgent',
      eco_points: ecoPoints,
      analysis: {
        waste_type: aiResponse.analysis?.waste_type || 'General waste',
        severity: aiResponse.analysis?.severity || 'Moderate',
        environmental_impact: aiResponse.analysis?.environmental_impact || 'Standard cleanup required',
        cleanup_difficulty: aiResponse.analysis?.cleanup_difficulty || 'Medium effort',
        reasoning: aiResponse.analysis?.reasoning || 'AI analysis completed with standard assessment'
      }
    };

    console.log(`AI Analysis: Priority=${priority}, Points=${ecoPoints}`);
    return analysis;

  } catch (error) {
    console.error('Error analyzing waste report with AI:', error);
    
    // Return default analysis if AI fails
    return {
      priority_level: 'medium',
      eco_points: 20, // Fixed: medium priority = 20 points
      analysis: {
        waste_type: 'General waste',
        severity: 'Moderate',
        environmental_impact: 'Standard cleanup required',
        cleanup_difficulty: 'Medium effort',
        reasoning: 'AI analysis unavailable, using default medium priority assessment (20 points)'
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

// Utility function to validate and recalculate points if needed
export const validateAndFixEcoPoints = (priority: string, currentPoints: number): number => {
  const correctPoints = getEcoPointsByPriority(priority);
  
  if (currentPoints !== correctPoints) {
    console.warn(`Points mismatch detected: Priority=${priority} should be ${correctPoints} points, but got ${currentPoints}. Fixing...`);
    return correctPoints;
  }
  
  return currentPoints;
};