
import { GoogleGenAI } from "@google/genai";
import { MedicalRecord } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const getFirstAidAdvice = async (record: MedicalRecord): Promise<string> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing");
    return "Ensure patient airway is clear and monitor vitals until help arrives.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    You are an emergency medical assistant. 
    A patient has triggered an emergency alert. 
    Here are their medical details:
    - Blood Type: ${record.bloodType}
    - Allergies: ${record.allergies}
    - Conditions: ${record.conditions}
    - Medications: ${record.medications}

    Provide a brief, professional 3-sentence summary for first responders on what to be careful about (e.g., allergies, drug interactions) and immediate steps based on these conditions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text || "No AI advice available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ensure patient airway is clear and monitor vitals until help arrives.";
  }
};

export const analyzeSymptoms = async (symptoms: string, record: MedicalRecord): Promise<string> => {
  if (!API_KEY) {
    return "AI Service Unavailable (Missing Key)";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    You are a hospital information assistant. A patient is reporting the following symptoms: "${symptoms}".
    Their medical context: ${record.conditions}, Allergies: ${record.allergies}.
    
    Provide general hospital information and next steps. 
    1. Acknowledge the symptoms.
    2. Provide general self-care advice or hospital navigation (e.g., visit the ER if pain is severe, or book a consultation).
    3. Keep it brief and informative. Do not diagnose.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text || "Information unavailable.";
  } catch (error) {
    return "Please consult with the attending physician or visit the triage station for immediate assessment.";
  }
};
