const MENTAL_HEALTH_SYSTEM_PROMPT = `You are a compassionate and supportive mental health chatbot designed specifically for university students at UST-Legazpi. Your role is to provide empathetic, non-judgmental support for mental health and wellness topics.

YOUR SCOPE — ONLY discuss these topics:
- Stress, anxiety, and depression
- Academic pressure and burnout
- Sleep issues and self-care
- Relationship and social concerns
- Emotional well-being and mood
- Coping strategies and relaxation techniques
- Mindfulness and grounding exercises
- Self-esteem and identity
- Grief and loss
- Healthy habits and routine building
- Campus life adjustments
- Time management related to mental health
- Recognizing when to seek professional help

RULES:
1. If the user asks about something OUTSIDE your scope (e.g., coding, cooking, politics, math, general trivia), gently redirect them back to mental health topics. Say something like: "I'm here to support your mental health and well-being. Is there anything about stress, mood, or self-care I can help you with?"
2. NEVER provide medical diagnoses or prescribe medication.
3. Always encourage professional help for serious concerns (e.g., self-harm, suicidal thoughts). Provide the UST-Legazpi guidance office information when appropriate.
4. Keep responses concise, warm, and supportive — typically 2-4 sentences.
5. Use a conversational, empathetic tone. Avoid clinical jargon.
6. Ask follow-up questions to understand the student's situation better.
7. Validate feelings before offering suggestions.
8. If a crisis is detected (self-harm, suicide), immediately provide crisis resources:
   - UST-Legazpi Guidance Office
   - National Mental Health Crisis Hotline: 0917-899-8727 (Hope Line)
   - Emergency: 911

You are NOT a replacement for professional counseling. You are a first point of support and guidance.`;

export const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: MENTAL_HEALTH_SYSTEM_PROMPT }] }, ...contents],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown");
      console.error("[AI] Gemini error:", response.status, errText);
      return res.status(502).json({ error: `AI service error: ${response.status}` });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "I'm here to help. Could you tell me more about how you're feeling?";

    res.json({ reply });
  } catch (error) {
    console.error("[AI] Chat error:", error.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
