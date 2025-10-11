import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ClassificationRequest {
  subject: string;
  description: string;
  openaiApiKey: string;
}

interface ClassificationResult {
  category: string;
  urgency: string;
  department: string;
  suggestedReply: string;
  slaHours: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { subject, description, openaiApiKey }: ClassificationRequest = await req.json();

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call OpenAI API for classification
    const classificationPrompt = `You are a helpdesk triage assistant. Analyze the following support ticket and provide classification in JSON format.

Ticket Subject: ${subject}
Ticket Description: ${description}

Provide your response as a JSON object with these exact fields:
- category: one of ["Billing", "Bug", "Feature Request", "Abuse Report", "General Inquiry"]
- urgency: one of ["Low", "Medium", "High"]
- department: one of ["Finance", "Dev", "Product", "Security", "Support"]
- reasoning: brief explanation of your classification

Consider:
- Billing issues are High urgency
- Security/Abuse are High urgency
- Bugs affecting production are High urgency
- Feature requests are typically Low to Medium urgency
- Use keywords and context to determine category`;

    const classificationResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpdesk triage assistant. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: classificationPrompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!classificationResponse.ok) {
      throw new Error(`OpenAI API error: ${classificationResponse.statusText}`);
    }

    const classificationData = await classificationResponse.json();
    const classificationText = classificationData.choices[0].message.content;
    
    // Parse the JSON response
    let classification;
    try {
      classification = JSON.parse(classificationText);
    } catch (e) {
      // If parsing fails, extract JSON from markdown code blocks
      const jsonMatch = classificationText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       classificationText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse classification response");
      }
    }

    // Generate suggested reply
    const replyPrompt = `You are a professional customer support agent. Write a helpful, empathetic first response to this support ticket.

Ticket Subject: ${subject}
Ticket Description: ${description}
Category: ${classification.category}
Urgency: ${classification.urgency}

Write a professional response that:
1. Acknowledges their issue
2. Shows empathy
3. Explains next steps
4. Sets expectations for resolution time
5. Is concise (2-3 paragraphs max)

Do not make up specific details or promises. Keep it general but helpful.`;

    const replyResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional customer support agent.",
            },
            {
              role: "user",
              content: replyPrompt,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!replyResponse.ok) {
      throw new Error(`OpenAI API error: ${replyResponse.statusText}`);
    }

    const replyData = await replyResponse.json();
    const suggestedReply = replyData.choices[0].message.content;

    // Determine SLA hours based on urgency
    const slaHours = classification.urgency === "High" ? 4 : 
                    classification.urgency === "Medium" ? 24 : 48;

    const result: ClassificationResult = {
      category: classification.category,
      urgency: classification.urgency,
      department: classification.department,
      suggestedReply,
      slaHours,
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in classify-ticket function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
