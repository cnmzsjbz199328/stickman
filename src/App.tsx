import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Code, Sparkles, Wand2 } from 'lucide-react';
import { World, Actor, Platform } from './engine/World';
import { PhysicsSystem } from './engine/PhysicsSystem';
import { ActionSystem } from './engine/ActionSystem';
import { Stickman } from './components/Stickman';

const defaultScene = {
  "world": {
    "groundY": 160,
    "actors": [
      { "id": "A", "x": 50, "y": 160, "color": "#3b82f6" },
      { "id": "B", "x": 550, "y": 160, "color": "#ef4444" }
    ],
    "platforms": [
      { "id": "plat1", "x": 300, "y": 100, "width": 140, "height": 10, "color": "#475569" }
    ]
  },
  "script": [
    [ { "actor": "A", "action": "move", "x": 300, "duration": 1500, "speed": 1.2 } ],
    [ { "actor": "A", "action": "jump", "duration": 800, "height": 1.2 } ],
    [
      { "actor": "A", "action": "speak", "text": "High ground!", "duration": 1500 },
      { "actor": "B", "action": "move", "x": 260, "duration": 1500, "speed": 1.5 }
    ],
    [ { "actor": "B", "action": "speak", "text": "Not fair!", "duration": 1500 } ],
    [ { "actor": "B", "action": "jump", "duration": 800, "height": 1.2 } ],
    [ { "actor": "B", "action": "attack", "duration": 300, "force": 1.5, "speed": 1.2 } ],
    [ { "actor": "A", "action": "speak", "text": "Ouch!", "duration": 1000 } ]
  ]
};

export default function App() {
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultScene, null, 2));
  const [prompt, setPrompt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resetCount, setResetCount] = useState(0);
  
  const worldRef = useRef<World>(new World());
  const [actors, setActors] = useState<Actor[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const playIdRef = useRef(0);

  const loadWorld = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const newWorld = new World();
      const newActors: Actor[] = [];
      const newPlatforms: Platform[] = [];

      if (parsed.world) {
        if (parsed.world.groundY !== undefined) {
          newWorld.groundY = parsed.world.groundY;
        }
        if (parsed.world.actors) {
          parsed.world.actors.forEach((a: any) => {
            const actor = new Actor(a.id, a.x, a.y || newWorld.groundY, a.color || '#000000');
            newWorld.add(actor);
            newActors.push(actor);
          });
        }
        if (parsed.world.platforms) {
          parsed.world.platforms.forEach((p: any) => {
            const plat = new Platform(p.id, p.x, p.y, p.width, p.height, p.color);
            newWorld.add(plat);
            newPlatforms.push(plat);
          });
        }
      }

      worldRef.current = newWorld;
      setActors(newActors);
      setPlatforms(newPlatforms);
      return parsed;
    } catch (e) {
      console.error("Failed to parse world", e);
      return null;
    }
  };

  useEffect(() => {
    loadWorld(jsonText);
  }, [resetCount]);

  useEffect(() => {
    let reqId: number;
    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      PhysicsSystem.update(worldRef.current, dt);
      ActionSystem.update(worldRef.current, time, dt);

      reqId = requestAnimationFrame(gameLoop);
    };

    reqId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
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
      
      if (data.success && data.content) {
        let jsonStr = data.content;
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        }
        const parsed = JSON.parse(jsonStr);
        setJsonText(JSON.stringify(parsed, null, 2));
        handleReset();
      } else {
        throw new Error("Invalid response from custom backend");
      }
    } catch (err: any) {
      setError('AI Generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    try {
      const parsed = loadWorld(jsonText);
      if (!parsed || !parsed.script) {
        setError('Invalid JSON format or missing script');
        return;
      }
      
      setError('');
      setIsPlaying(true);
      
      playIdRef.current += 1;
      const currentPlayId = playIdRef.current;

      for (const step of parsed.script) {
        if (currentPlayId !== playIdRef.current) break;

        const promises = step.map(async (act: any) => {
          const actor = worldRef.current.get(act.actor) as Actor;
          if (!actor) return;
          
          const t = performance.now();

          switch (act.action) {
            case 'speak': 
              if ((actor as any).speak) await (actor as any).speak(act.text, act.duration || 1500); 
              break;
            default:
              await ActionSystem.execute(actor, act.action, act, t);
              break;
          }
        });

        await Promise.all(promises);
      }
    } catch (err) {
      setError('Invalid JSON format');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    playIdRef.current += 1;
    setIsPlaying(false);
    setResetCount(c => c + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-blue-400" />
              AI Stickman Studio
            </h1>
            <p className="text-gray-400 text-sm mt-1">Powered by Llama 3.1 & Forward Kinematics</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button 
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Play className="w-4 h-4" /> {isPlaying ? 'Playing...' : 'Play Script'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[600px]">
          {/* Left Panel: Editor & AI */}
          <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-gray-800">AI Director</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a scene... e.g. 'Actor A walks to the center, waves, then Actor B jumps and attacks.'"
                className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isGenerating ? 'Generating Script...' : 'Generate Script'}
              </button>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-gray-200 bg-gray-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-600" />
                <h2 className="font-semibold text-gray-700 text-sm">JSON Script</h2>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-xs bg-gray-900 text-green-400 resize-none focus:outline-none"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Right Panel: Stage */}
          <div className="w-full md:w-2/3 bg-gray-50 relative flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <svg width="600" height="200" className="w-full h-auto bg-white rounded-xl border border-gray-200 shadow-sm relative z-10">
              {/* Ground Line */}
              <line x1="0" y1={worldRef.current.groundY} x2="600" y2={worldRef.current.groundY} stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Platforms */}
              {platforms.map(platform => (
                <g key={platform.id} transform={`translate(${platform.x}, ${platform.y})`}>
                  <rect x={-platform.width/2} y={0} width={platform.width} height={platform.height} fill={platform.color || "#6b7280"} rx="4" />
                  <rect x={-platform.width/2} y={0} width={platform.width} height={4} fill="rgba(255,255,255,0.2)" rx="2" />
                </g>
              ))}

              {/* Actors */}
              {actors.map(actor => (
                <Stickman key={actor.id} actor={actor} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
