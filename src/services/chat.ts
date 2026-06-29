const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export async function answerFromNotes(question: string, notes: any[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing in environment variables.');
  }

  const context = notes.map((note, index) => {
    const title = note.title || 'Untitled';
    const rawContent = note.content || '';
    
    // Attempt to extract subject, explanation, and takeaway from the structured content
    const subjectMatch = rawContent.match(/SUBJECT:\s*(.+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'General';
    
    const explanationMatch = rawContent.match(/EXPLANATION:\s*([\s\S]*?)(?:KEY TAKEAWAY:|$)/);
    const explanation = explanationMatch ? explanationMatch[1].trim() : rawContent;
    
    const takeawayMatch = rawContent.match(/KEY TAKEAWAY:\s*([\s\S]*?)(?:$)/);
    const takeaway = takeawayMatch ? takeawayMatch[1].trim() : '';
    
    const contentText = `${explanation}\n${takeaway}`.trim();

    return `Note ${index + 1} - Title: ${title}, Subject: ${subject}, Content: ${contentText}`;
  }).join('\n\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: "You are a helpful study assistant for a college student in India. The student has saved notes from their classroom photos. Answer the student's question ONLY based on the notes provided. If the answer is not in the notes, say 'I could not find this in your notes. Try importing more classroom photos.' Keep answers concise and friendly."
          },
          {
            role: 'user',
            content: `My notes:\n${context}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.3, // Lower temperature since we want grounded answers
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
    console.error('Error in answerFromNotes:', error);
    throw error;
  }
}
