import * as FileSystem from 'expo-file-system/legacy';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export async function extractNotesFromImage(imageUri: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing in environment variables.');
  }

  try {
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let mimeType = 'image/jpeg';
    if (imageUri.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (imageUri.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    } else if (imageUri.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: `You are a smart study assistant for college students in India. A student has clicked a photo of something their teacher showed in class — it could be a board, projector slide, or handwritten notes.

Your job is to:
1. Identify what is shown in the photo (formula, questions, definition, diagram, concept etc.)
2. Explain it clearly to a college student in simple English
3. Give context — why is this important, where is it used, what should the student remember

Return output in this exact format:

TYPE: [Formula/Questions/Definition/Concept/Mixed]
SUBJECT: [subject name if you can tell, otherwise General]
TITLE: [a short descriptive title for what this is, max 6 words]

WHAT THIS IS:
[1-2 lines explaining what exactly is shown in the photo]

EXPLANATION:
[explain the content clearly and simply. if its formulas, explain what each variable means. if its questions, explain what each question is testing. if its a concept, explain it like a good teacher would. keep it concise but useful.]

KEY TAKEAWAY:
[1-2 lines on what the student must remember from this]

Never use LaTeX. Write math in plain text (1/2 not fraction notation).
Never add information not relevant to what is shown in the photo.
Keep language simple and friendly.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract and explain the contents of this classroom photo.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Invalid response structure or empty content from Groq API');
    }

    return content;
  } catch (error) {
    console.error('Error in extractNotesFromImage:', error);
    throw error;
  }
}
