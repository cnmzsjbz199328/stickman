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
- **Shared World State**: Actors register themselves in a shared `WorldState` ref, allowing them to know each other's positions without triggering React re-renders.
- **AABB Collision Detection**: Characters have a bounding box (width: 40px). When walking, the engine checks for collisions and physically prevents actors from overlapping or walking through each other.
- **Hit Detection & Knockback**: The `attack` action isn't just a visual animation. It casts a hitbox (60px range). If another actor is within range, it triggers their `onHit` callback, interrupting their current action and applying a physical knockback force with a flailing animation.

### 4. 🧠 Animation State Machine & Physics
The engine includes a built-in state machine that handles blending and overrides:
- **Base States**: `Idle` (breathing), `Walk` (swinging limbs), `Dance`.
- **Overrides**: Actions like `Jump`, `Attack`, `Wave`, and `Flip` temporarily override specific limb angles or body rotations.
- **Animation Juice**: Includes procedural physical nuances like **Center of Mass bouncing** (the body bobs up and down while walking) and **Squash & Stretch** (the body elongates during a jump).

### 5. 🤖 AI Director (Llama 3.1 Integration)
The project integrates a custom AI backend (`unified-ai-backend.tj15982183241.workers.dev`) running **Llama 3.1 8B** via Cerebras.
- **Prompt Engineering**: Since Llama 3.1 does not have native enforced JSON schemas like Gemini, the engine uses strict prompt engineering to instruct the model to return *only* raw JSON.
- **Robust Parsing**: Includes a regex fallback (`jsonStr.match(/\[[\s\S]*\]/)`) to safely extract the JSON array even if the LLM wraps the response in Markdown code blocks.

### 6. 🚀 Future Expansions & Technical Vision (Roadmap to a 2D Game Engine)
The engine is transitioning from an animation player into a fully systematic AI-driven 2D game engine. The development roadmap is prioritized as follows:

1. **Vertical Physics & Gravity**: Introduce a true Y-axis, vertical velocity (`vy`), and gravity to support jumping, falling, and ground collision.
2. **Unified World System**: Consolidate actors and static objects (walls, tables, weapons) into a single `World` state with a unified spatial structure (`x, y, width, height, type, solid`).
3. **Platform System**: Implement one-way platforms (stand on top, pass through from below) to evolve from a "flat stage" to a level-based environment.
4. **Independent Collision System**: Decouple collision logic from movement/attack actions into a standalone `CollisionSystem` that handles solid (blocking) and trigger (hit/pickup) collisions.
5. **Extensible Action System**: Refactor hardcoded actions into a registry-based `ActionSystem` and introduce a **Timeline System** to support action overlapping, canceling, and blending.
6. **Weapon System (V1)**: Bind weapons to FK skeletal joints (hands) with independent hitboxes that activate during attacks.
7. **AI Protocol Upgrade**: Enhance the JSON schema so the AI generates not just the `script`, but also the `actors` and `objects` to dynamically construct the world.
8. **Event System**: Introduce an event bus (`emit("hit")`, `emit("land")`) to trigger reactive behaviors and allow the AI to generate dynamic story continuations based on engine events.

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

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

*(Note: The AI generation relies a custom public endpoint, so no local API keys are required to run the AI Director).*
