export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const promptText = `Generate a 2D stickman animation scene based on this request: "${prompt}". 
The stage is 600px wide. Ground is at y: 160.
You must generate BOTH the "world" (actors and platforms) and the "script" (actions).

Available actions and their optional parameters (use them to add variety!):
- move: x (required), speed (multiplier, e.g. 1.5 for fast)
- jump: height (multiplier, e.g. 1.2 for high jump)
- attack: force (knockback multiplier), speed
- wave: speed
- speak: text (required)
- dance, flip

Group actions in inner arrays if they should happen at the same time. Make it creative!

IMPORTANT: You MUST return ONLY a valid JSON object. Do not include any markdown formatting, backticks, or explanations. Just the raw JSON object.
Example format:
{
  "world": {
    "actors": [
      { "id": "A", "x": 50, "y": 100, "color": "#3b82f6" },
      { "id": "B", "x": 550, "y": 100, "color": "#ef4444" }
    ],
    "platforms": [
      { "id": "plat1", "x": 300, "y": 50, "width": 140, "height": 10 }
    ]
  },
  "script": [
    [{"actor": "A", "action": "move", "x": 200, "duration": 1000}],
    [{"actor": "B", "action": "jump", "duration": 800}]
  ]
}`;

    const response = await fetch("https://unified-ai-backend.tj15982183241.workers.dev/v1/models/small", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: promptText }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
