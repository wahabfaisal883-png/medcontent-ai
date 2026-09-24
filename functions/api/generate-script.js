export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const topic = body.topic?.trim();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Please enter a medical topic." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = context.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured in Cloudflare." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const prompt = `
Create professional educational medical/nursing social-media content about:

Topic: ${topic}

Create:
1. A strong short-video hook
2. A clear 30-60 second voice-over script
3. 5 important educational points
4. A short conclusion
5. A YouTube title
6. A social-media caption
7. 8 relevant hashtags

Audience: nursing students and general health-education viewers.

Use simple English.
Keep medical information educational and evidence-based.
Do not diagnose an individual patient.
Do not give unsafe personalized medical advice.
Clearly recommend consulting a qualified healthcare professional when appropriate.

Format the response with clear headings.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-6-astra",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data?.error?.message || "OpenAI API request failed."
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const text =
      data.output_text ||
      data.output
        ?.filter(item => item.type === "message")
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("\n") ||
      "";

    return new Response(
      JSON.stringify({
        success: true,
        topic,
        content: text
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Server error."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
