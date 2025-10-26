import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

// Initialize Gemini - API key from environment variable
const genAI = new GoogleGenAI({});

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required" });
    }

    const { userId } = req.user;
    
    // Get patient health context
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        healthRecords: {
          include: { 
            prescriptions: true,
            testResults: true 
          },
          orderBy: { visitDate: 'desc' },
          take: 5
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    // Prepare health context
    const healthContext = patient.healthRecords.length > 0
      ? `Patient's recent health history:\n${JSON.stringify(patient.healthRecords, null, 2)}`
      : "No health records available.";
    
    // Create prompt with context
    const prompt = `You are a helpful health assistant. 

${healthContext}

Patient's question: ${message}

Provide helpful health advice based on their health history, but always remind them to consult their doctor for medical decisions. Keep your response concise and easy to understand.`;

    // Generate response using the new API - try gemini-2.0-flash-exp or gemini-2.5-flash
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",  // Changed model name
      contents: prompt,
    });

    const aiResponse = response.text;

    if (!aiResponse) {
      return res.status(500).json({ error: "Failed to generate AI response" });
    }
    
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in AI chat:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
};

export const generateHealthPrediction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.user;
    
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        healthRecords: {
          include: { 
            prescriptions: true, 
            testResults: true 
          },
          orderBy: { visitDate: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (!patient.healthRecords || patient.healthRecords.length === 0) {
      return res.status(400).json({ 
        error: "No health records available for analysis" 
      });
    }
    
    // Create detailed prompt for health prediction
    const prompt = `You are a medical AI analyzing health records for risk prediction.

Analyze this patient's complete health history:
${JSON.stringify(patient.healthRecords, null, 2)}

Patient Information:
- Blood Group: ${patient.bloodGroup || 'Not specified'}
- Allergies: ${patient.allergies || 'None reported'}
- Date of Birth: ${patient.dateOfBirth}

Based on this information, provide a comprehensive health risk analysis. You MUST respond with ONLY a valid JSON object in this EXACT format:

{
  "riskFactors": ["factor1", "factor2", "factor3"],
  "predictions": "Detailed prediction text explaining potential health risks",
  "recommendations": "Detailed recommendations for prevention and management",
  "riskScore": 5
}

Important:
- riskFactors: Array of specific health risk factors identified (minimum 2, maximum 5)
- predictions: String with detailed health risk predictions (2-3 sentences)
- recommendations: String with actionable health recommendations (numbered list format)
- riskScore: Number from 1-10 (1=very low risk, 10=very high risk)

Respond ONLY with the JSON object, no markdown formatting, no other text before or after.`;

    // Generate prediction using the new API
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",  // Changed model name
      contents: prompt,
    });

    const aiContent = response.text;

    if (!aiContent) {
      return res.status(500).json({ error: "Failed to generate AI prediction" });
    }

    let analysis: {
      riskFactors?: string[];
      predictions?: string;
      recommendations?: string;
      riskScore?: number;
    };

    try {
      // Clean the response (remove markdown code blocks if present)
      const cleanedContent = aiContent
        .replace(/```json\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();
      
      console.log("Cleaned AI response:", cleanedContent);
      
      analysis = JSON.parse(cleanedContent);
      
      // Validate the response structure
      if (!analysis.riskFactors || !Array.isArray(analysis.riskFactors)) {
        throw new Error("Invalid risk factors format");
      }
      if (!analysis.predictions || typeof analysis.predictions !== 'string') {
        throw new Error("Invalid predictions format");
      }
      if (!analysis.recommendations || typeof analysis.recommendations !== 'string') {
        throw new Error("Invalid recommendations format");
      }
      if (typeof analysis.riskScore !== 'number' || analysis.riskScore < 1 || analysis.riskScore > 10) {
        throw new Error("Invalid risk score");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      console.error("Parse error:", parseError);
      
      // Fallback: Create a basic analysis based on diagnosis keywords
      const diagnoses = patient.healthRecords.map(r => r.diagnosis?.toLowerCase() || '');
      const riskFactors: string[] = [];
      let riskScore = 3;
      
      if (diagnoses.some(d => d.includes('hypertension') || d.includes('blood pressure'))) {
        riskFactors.push('Hypertension detected in medical history');
        riskScore += 2;
      }
      if (diagnoses.some(d => d.includes('diabetes'))) {
        riskFactors.push('Diabetes management required');
        riskScore += 2;
      }
      if (diagnoses.some(d => d.includes('heart') || d.includes('cardiac'))) {
        riskFactors.push('Cardiovascular concerns identified');
        riskScore += 3;
      }
      if (diagnoses.some(d => d.includes('cholesterol'))) {
        riskFactors.push('Cholesterol level monitoring needed');
        riskScore += 1;
      }
      
      if (riskFactors.length === 0) {
        riskFactors.push('General health monitoring recommended');
        riskFactors.push('Preventive care suggested');
      }
      
      analysis = {
        riskFactors,
        predictions: `Based on your health records showing ${diagnoses.join(', ')}, continued monitoring and adherence to your treatment plan is recommended. Regular check-ups with your healthcare provider are important to manage these conditions effectively.`,
        recommendations: `1. Schedule regular check-ups with your healthcare provider every 3-6 months\n2. Maintain a balanced diet rich in fruits, vegetables, and whole grains\n3. Exercise regularly for at least 30 minutes daily\n4. Take all prescribed medications as directed\n5. Monitor your vital signs regularly\n6. Avoid smoking and limit alcohol consumption\n7. Manage stress through relaxation techniques`,
        riskScore: Math.min(10, riskScore)
      };
    }
    
    // Save analysis to database
    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        patientId: patient.id,
        riskFactors: analysis.riskFactors || [],
        predictions: analysis.predictions || 'No predictions available',
        recommendations: analysis.recommendations || 'No recommendations available',
        riskScore: analysis.riskScore || 5
      }
    });
    
    res.json(aiAnalysis);
  } catch (error) {
    console.error("Error generating health prediction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
};

// Add this function to test available models
export const listModels = async (req: Request, res: Response) => {
  try {
    const models = await genAI.models.list();
    res.json(models);
  } catch (error) {
    console.error("Error listing models:", error);
    res.status(500).json({ error: error });
  }
};