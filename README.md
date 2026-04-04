# 🎬 AI-Driven Stickman Story Engine

A lightweight, high-performance SVG stickman animation engine built with React. It features a JSON-driven scripting system and integrates Google's Gemini AI to translate natural language prompts directly into choreographed animations.

## ✨ Features

- **🚀 High-Performance SVG Animation**: Uses `requestAnimationFrame` and direct DOM manipulation (`useRef`) to bypass React's render cycle, ensuring buttery-smooth 60FPS skeletal animations.
- **📜 JSON-Driven Scripting**: Choreograph complex scenes using a simple, declarative JSON array structure. Supports both sequential steps and parallel actions.
- **🤖 AI Director (Gemini Integration)**: Type a natural language prompt (e.g., *"A walks to B, says hello, and B does a backflip"*), and the Gemini AI will automatically generate the corresponding JSON script using strict Structured Outputs (`responseSchema`).
- **🎭 Rich Action Library**: Built-in support for walking, jumping, speaking, attacking, waving, dancing, and flipping.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **AI Integration**: `@google/genai` (Gemini 3 Flash Preview)

## 🎮 How It Works

The engine separates the "Brain" (AI/Scripting) from the "Body" (Rendering). 

### The Scripting Engine
Scripts are written as an array of steps. Each step is an array of actions that happen **simultaneously**. The engine waits for all actions in a step to complete before moving to the next step.

```json
[
  [
    { "actor": "A", "action": "move", "x": 300, "duration": 1000 },
    { "actor": "B", "action": "wave", "duration": 1000 }
  ],
  [
    { "actor": "A", "action": "speak", "text": "Hello!", "duration": 1500 }
  ]
]
```

### Available Actions

| Action | Description | Required Params | Optional Params |
| :--- | :--- | :--- | :--- |
| `move` | Walks to a specific X coordinate. Auto-flips direction. | `x` (number) | `duration` (ms) |
| `jump` | Performs a vertical jump using a sine wave arc. | - | `duration` (ms) |
| `speak` | Displays a speech bubble above the stickman. | `text` (string) | `duration` (ms) |
| `attack` | Performs a quick forward punch. | - | `duration` (ms) |
| `wave` | Raises an arm and waves. | - | `duration` (ms) |
| `dance` | Swings arms and legs rhythmically while bouncing. | - | `duration` (ms) |
| `flip` | Performs a 360-degree backflip/frontflip. | - | `duration` (ms) |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A Google Gemini API Key

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧠 The AI Director Implementation

The AI Director uses the `@google/genai` SDK with a strict `responseSchema`. This forces the LLM to output a perfectly formatted JSON array that matches our engine's exact requirements, eliminating parsing errors and hallucinations.

```typescript
responseSchema: {
  type: Type.ARRAY,
  items: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        actor: { type: Type.STRING },
        action: { type: Type.STRING },
        x: { type: Type.NUMBER },
        text: { type: Type.STRING },
        duration: { type: Type.NUMBER }
      },
      required: ["actor", "action"]
    }
  }
}
```

## 🔮 Future Enhancements

- **Props & Environment**: Add support for generating background elements or holding items.
- **More Actors**: Dynamically spawn new stickmen via the JSON script.
- **Sound Effects**: Trigger audio clips synchronized with actions (e.g., punch sounds, jump sounds).
- **Collision Detection**: Allow stickmen to interact physically (e.g., pushing each other).

---
*Built with ❤️ using React and Google Gemini.*
