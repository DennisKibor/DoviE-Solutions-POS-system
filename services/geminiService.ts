
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a short, appetizing product description for a ${category} item named "${productName}". Keep it under 25 words.`,
  });
  return response.text?.trim() || "Delicious freshly made product.";
};

export const generateComprehensiveIntelligence = async (salesData: any[], products: any[]): Promise<any> => {
  const ai = getAI();
  
  // Prepare data context
  const salesSummary = salesData.map(s => ({
    id: s.id,
    total: s.total,
    items: s.items.map((i: any) => ({ name: i.name, qty: i.quantity })),
    timestamp: s.timestamp,
    status: s.status
  })).slice(-50); // Last 50 sales for context

  const inventoryContext = products.map(p => ({
    name: p.name,
    stock: p.stock,
    category: p.category
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Analyze this retail data and provide JSON output.
      Sales: ${JSON.stringify(salesSummary)}
      Inventory: ${JSON.stringify(inventoryContext)}

      Generate:
      1. 'salesSummary': A 2-sentence summary of today's/recent performance.
      2. 'topProducts': Array of top 3 best selling product names.
      3. 'lowStockPrediction': Array of products (max 3) likely to run out in 7 days based on volume.
      4. 'trend': A brief comparison of current sales vs hypothetical previous period patterns.
      5. 'restockSuggestions': Array of {name, suggestedQty, reason}.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          salesSummary: { type: Type.STRING },
          topProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
          lowStockPrediction: { type: Type.ARRAY, items: { type: Type.STRING } },
          trend: { type: Type.STRING },
          restockSuggestions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                suggestedQty: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              }
            } 
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("AI Parse Error", e);
    return null;
  }
};

export const generateProductImage = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Professional studio photography of ${prompt}, high resolution, commercial quality, white background`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return 'https://picsum.photos/seed/error/200';
};
