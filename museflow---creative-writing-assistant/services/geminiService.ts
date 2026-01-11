import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, CharacterProfile, ModelType } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Construct a prompt that includes character context
const buildPromptWithContext = (message: string, characters: CharacterProfile[]): string => {
  let context = "";
  if (characters.length > 0) {
    context += "\n\n[ACTIVE CHARACTER CONTEXT]\n";
    characters.forEach(c => {
      context += `Name: ${c.name}\nRole: ${c.role}\nAppearance: ${c.appearance}\nBackstory: ${c.backstory}\nStrengths: ${c.strengths}\nWeaknesses: ${c.weaknesses}\nGoals: ${c.goals}\nRelationships: ${c.relationships}\n---\n`;
    });
    context += "[END CONTEXT]\n\n";
  }
  return context + message;
};

export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  characters: CharacterProfile[],
  modelId: string, // Added modelId parameter
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
        topK: 64,
        topP: 0.95,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    const fullPrompt = buildPromptWithContext(newMessage, characters);
    const resultStream = await chat.sendMessageStream({ message: fullPrompt });

    let fullText = "";
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        onChunk(fullText);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Error streaming chat:", error);
    throw error;
  }
};

export const generateCharacterSuggestion = async (
  field: string,
  profile: Partial<CharacterProfile>
): Promise<string> => {
  try {
    const prompt = `
      I am designing a character for a story.
      Name: ${profile.name || 'Unknown'}
      Role: ${profile.role || 'Unknown'}
      
      Current Attributes:
      ${JSON.stringify(profile)}

      Please generate a creative, unique, and deep suggestion for the field: "${field}". 
      Keep it concise (under 50 words) but evocative. 
      Focus on making the character unique and memorable.
    `;

    // Always use Pro for character generation as it requires high creativity but short output (cheap)
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_PRO,
      contents: prompt,
      config: {
        temperature: 1.0,
      }
    });

    return response.text || "Could not generate suggestion.";
  } catch (error) {
    console.error("Error generating suggestion:", error);
    return "Error generating suggestion.";
  }
};

export const generateSessionTitle = async (firstMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_FLASH, // Using Gemini 3.0 Flash for this basic task
      contents: `Summarize the following story idea/prompt into a very short, catchy title (max 6 words). Do not use quotes. Prompt: ${firstMessage}`,
    });
    return response.text?.trim() || "New Story";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Story";
  }
};
