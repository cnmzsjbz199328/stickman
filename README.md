# 🎬 AI-Driven Stickman Skeletal Engine

A high-performance, 2D skeletal animation engine built with React and SVG. It features a custom Forward Kinematics (FK) joint system, a robust state machine, and an AI Director powered by **Llama 3.1 (8B)** to translate natural language prompts directly into choreographed JSON animations.

## ✨ Core Technical Features

### 1. 🦴 Skeletal Animation & Forward Kinematics (FK)
Unlike basic SVG animations that manipulate raw `(x, y)` coordinates, this engine uses a true hierarchical joint system.
- **8-Part Limb System**: The body is divided into hierarchical segments: `Shoulder -> Upper Arm -> Elbow -> Lower Arm` and `Hip -> Upper Leg -> Knee -> Lower Leg`.
- **Angle-Driven Math**: Animations are driven by calculating angles (`Math.sin()`, `Math.cos()`) rather than absolute positions. The engine uses Forward Kinematics to derive the final `(x, y)` coordinates of the hands and feet based on the angles of the parent joints.
  ```javascript
  const getEnd = (x, y, angle, len) => ({
    x: x + Math.cos(angle) * len,
    y: y + Math.sin(angle) * len
  });
  ```

### 2. ⚙️ High-Performance Render Loop
React's standard state (`useState`) is too slow for 60FPS animations due to virtual DOM diffing overhead.
- **Direct DOM Manipulation**: The engine uses a single `requestAnimationFrame` loop.
- **Ref-Based Updates**: We maintain references (`useRef`) to the underlying SVG `<line>` and `<g>` elements and update them directly via `setAttribute()`, completely bypassing React's render cycle during playback.

### 3. 🌍 World Simulation & Physics System
The engine has evolved from a pure animation player into a mini game engine with spatial awareness.
- **Shared World State**: Actors register themselves in a shared `World` class, allowing them to know each other's positions without triggering React re-renders.
- **AABB Collision Detection**: Characters have a bounding box (width: 40px). When walking, the engine checks for collisions and physically prevents actors from overlapping or walking through each other.
- **Hit Detection & Knockback**: The `attack` action isn't just a visual animation. It casts a hitbox (60px range). If another actor is within range, it triggers their `onHit` callback, interrupting their current action and applying a physical knockback force with a flailing animation.

### 4. 🧠 Animation State Machine & Extensible Action Registry (NEW)
The engine includes a built-in state machine and a highly modular action architecture:
- **Registry & Plugins**: Rather than hardcoded logic, all actions (Move, Jump, Attack) are standalone plugins separated into individual modules and registered dynamically via an `ActionRegistry`.
- **Action Manager & Priority**: A robust `ActionManager` evaluates timeline conflicts based on hierarchical priorities. For instance, high-priority actions like **Hit** (knockback) instantly interrupt and cancel lower-priority actions like walking or attacking.
- **Animation Juice**: Includes procedural physical nuances like **Center of Mass bouncing** (the body bobs up and down while walking) and **Squash & Stretch** (the body elongates during a jump).

### 5. 🤖 AI Director (Llama 3.1 via Vercel Serverless)
The project integrates a secure Vercel Serverless backend (`api/generate.ts`) acting as a proxy to an AI endpoint running **Llama 3.1 8B**.
- **Secure Architecture**: Environment variables and backend logic are hidden securely in standard Vercel serverless functions, decoupling them completely from the Vite React frontend.
- **Prompt Engineering**: The engine uses strict prompt engineering to instruct the model to return *only* raw JSON conforming to the engine's protocol.

### 6. 🚀 Future Expansions & Technical Vision (Roadmap)
The engine is transitioning from an animation player into a fully systematic AI-driven 2D game engine. The development roadmap is actively prioritized:

- [x] **Phase 1: Action Registry & Decoupling**: Refactored hardcoded acts into the `ActionRegistry` and introduced action priority management via `ActionManager`.
- [ ] **Phase 2: Physics & ECS**: Implement Vertical Physics, Gravity, advanced AABB Colliders, and state snapshot systems.
- [ ] **Phase 3: Advanced Animation**: Add CCD/Analytical IK Solvers for limb placement, procedural physical wobbling, and animation crossfading.
- [ ] **Phase 4: AI Intelligence**: Imbue the AI Director with spatial awareness capabilities and build an Event bus for reactive behaviors.

## 📜 The JSON Scripting Protocol

Scripts are parsed as an array of steps. Each step is an array of actions that execute **simultaneously** (parallel). The engine waits for all actions in a step to resolve before advancing to the next step (sequential).

```json
[
  [
    { "actor": "A", "action": "move", "x": 300, "duration": 1000 },
    { "actor": "B", "action": "wave", "duration": 1000 }
  ],
  [
    { "actor": "A", "action": "speak", "text": "Take this!", "duration": 1500 },
    { "actor": "A", "action": "attack", "duration": 400 }
  ]
]
```

### Supported Action API

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
- [Vercel CLI](https://vercel.com/cli) (Recommended for local API testing: `npm i -g vercel`)

### Installation & Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the local server using Vercel CLI (Recommended):
   ```bash
   vercel dev
   ```
   > 💡 **Important:** Using `vercel dev` will simultaneously start the Vite frontend and the Vercel backend Serverless APIs (`/api/generate`). If you only use `npm run dev`, the AI generation function will not map correctly.

### Deployment
The split frontend-backend architecture is 100% compliant with Vercel zero-config deployments. Pushing to GitHub or running `vercel --prod` will deploy the application and its serverless functions securely out of the box.
