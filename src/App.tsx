/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Play, RotateCcw, Code, Sparkles, Wand2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
export interface StickmanHandle {
  moveTo: (targetX: number, duration: number) => Promise<void>;
  jump: (duration?: number) => Promise<void>;
  speak: (text: string, duration?: number) => Promise<void>;
  attack: (duration?: number) => Promise<void>;
  wave: (duration?: number) => Promise<void>;
  dance: (duration?: number) => Promise<void>;
  flip: (duration?: number) => Promise<void>;
}

interface StickmanProps {
  id: string;
  initialX: number;
  color?: string;
}

// --- Stickman Component ---
const Stickman = forwardRef<StickmanHandle, StickmanProps>(({ id, initialX, color = 'black' }, ref) => {
  const groupRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const armLRef = useRef<SVGLineElement>(null);
  const armRRef = useRef<SVGLineElement>(null);
  const legLRef = useRef<SVGLineElement>(null);
  const legRRef = useRef<SVGLineElement>(null);
  
  const [speech, setSpeech] = useState('');

  const state = useRef({
    x: initialX,
    yOffset: 0,
    rotation: 0,
    direction: 1,
    
    isWalking: false,
    walkStart: initialX,
    walkTarget: initialX,
    walkStartTime: 0,
    walkDuration: 0,
    walkResolve: null as (() => void) | null,

    isJumping: false,
    jumpStartTime: 0,
    jumpDuration: 0,
    jumpResolve: null as (() => void) | null,

    isAttacking: false,
    attackStartTime: 0,
    attackDuration: 0,
    attackResolve: null as (() => void) | null,

    isWaving: false,
    waveStartTime: 0,
    waveDuration: 0,
    waveResolve: null as (() => void) | null,

    isDancing: false,
    danceStartTime: 0,
    danceDuration: 0,
    danceResolve: null as (() => void) | null,

    isFlipping: false,
    flipStartTime: 0,
    flipDuration: 0,
    flipResolve: null as (() => void) | null,

    t: 0,
  });

  useImperativeHandle(ref, () => ({
    moveTo: (targetX: number, duration: number) => new Promise<void>((resolve) => {
      state.current.walkStart = state.current.x;
      state.current.walkTarget = targetX;
      state.current.walkDuration = duration;
      state.current.walkStartTime = performance.now();
      state.current.isWalking = true;
      state.current.direction = targetX > state.current.x ? 1 : -1;
      state.current.walkResolve = resolve;
    }),
    jump: (duration: number = 800) => new Promise<void>((resolve) => {
      state.current.jumpStartTime = performance.now();
      state.current.jumpDuration = duration;
      state.current.isJumping = true;
      state.current.jumpResolve = resolve;
    }),
    speak: (text: string, duration: number = 1500) => new Promise<void>((resolve) => {
      setSpeech(text);
      setTimeout(() => {
        setSpeech('');
        resolve();
      }, duration);
    }),
    attack: (duration: number = 400) => new Promise<void>((resolve) => {
      state.current.attackStartTime = performance.now();
      state.current.attackDuration = duration;
      state.current.isAttacking = true;
      state.current.attackResolve = resolve;
    }),
    wave: (duration: number = 1500) => new Promise<void>((resolve) => {
      state.current.waveStartTime = performance.now();
      state.current.waveDuration = duration;
      state.current.isWaving = true;
      state.current.waveResolve = resolve;
    }),
    dance: (duration: number = 2000) => new Promise<void>((resolve) => {
      state.current.danceStartTime = performance.now();
      state.current.danceDuration = duration;
      state.current.isDancing = true;
      state.current.danceResolve = resolve;
    }),
    flip: (duration: number = 800) => new Promise<void>((resolve) => {
      state.current.flipStartTime = performance.now();
      state.current.flipDuration = duration;
      state.current.isFlipping = true;
      state.current.flipResolve = resolve;
    })
  }));

  useEffect(() => {
    let reqId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      // Base limb positions
      let armLx = -20, armLy = -10;
      let armRx = 20, armRy = -10;
      let legLx = -15, legLy = 30;
      let legRx = 15, legRy = 30;

      // 1. Handle Walking
      if (state.current.isWalking) {
        const elapsed = time - state.current.walkStartTime;
        const progress = Math.min(elapsed / state.current.walkDuration, 1);
        state.current.x = state.current.walkStart + (state.current.walkTarget - state.current.walkStart) * progress;
        state.current.t += dt * 0.015; 

        const swing = Math.sin(state.current.t) * 15;
        armLx += swing; armRx -= swing;
        legLx -= swing; legRx += swing;

        if (progress >= 1) {
          state.current.isWalking = false;
          if (state.current.walkResolve) {
            state.current.walkResolve();
            state.current.walkResolve = null;
          }
        }
      } else if (!state.current.isDancing) {
        state.current.t = 0; 
      }

      // 2. Handle Jumping
      if (state.current.isJumping) {
        const elapsed = time - state.current.jumpStartTime;
        const progress = Math.min(elapsed / state.current.jumpDuration, 1);
        state.current.yOffset = Math.sin(progress * Math.PI) * 30; 

        if (progress >= 1) {
          state.current.isJumping = false;
          state.current.yOffset = 0;
          if (state.current.jumpResolve) {
            state.current.jumpResolve();
            state.current.jumpResolve = null;
          }
        }
      }

      // 3. Handle Attacking (Punch)
      if (state.current.isAttacking) {
        const elapsed = time - state.current.attackStartTime;
        const progress = Math.min(elapsed / state.current.attackDuration, 1);
        const punch = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
        
        armRx = 20 + punch * 20;
        armRy = -10 - punch * 10;

        if (progress >= 1) {
          state.current.isAttacking = false;
          if (state.current.attackResolve) {
            state.current.attackResolve();
            state.current.attackResolve = null;
          }
        }
      }

      // 4. Handle Waving
      if (state.current.isWaving) {
        const elapsed = time - state.current.waveStartTime;
        const progress = Math.min(elapsed / state.current.waveDuration, 1);
        
        armRx = 20 + Math.sin(progress * Math.PI * 8) * 10;
        armRy = -35; // Arm raised

        if (progress >= 1) {
          state.current.isWaving = false;
          if (state.current.waveResolve) {
            state.current.waveResolve();
            state.current.waveResolve = null;
          }
        }
      }

      // 5. Handle Dancing
      if (state.current.isDancing) {
        const elapsed = time - state.current.danceStartTime;
        const progress = Math.min(elapsed / state.current.danceDuration, 1);
        
        const danceSpeed = time * 0.02;
        armLx = -20 + Math.sin(danceSpeed) * 20;
        armLy = -20 + Math.cos(danceSpeed) * 10;
        armRx = 20 + Math.cos(danceSpeed) * 20;
        armRy = -20 + Math.sin(danceSpeed) * 10;
        
        legLx = -15 + Math.sin(danceSpeed * 2) * 10;
        legRx = 15 + Math.cos(danceSpeed * 2) * 10;
        
        state.current.yOffset = Math.abs(Math.sin(danceSpeed)) * 10;

        if (progress >= 1) {
          state.current.isDancing = false;
          state.current.yOffset = 0;
          if (state.current.danceResolve) {
            state.current.danceResolve();
            state.current.danceResolve = null;
          }
        }
      }

      // 6. Handle Flipping
      if (state.current.isFlipping) {
        const elapsed = time - state.current.flipStartTime;
        const progress = Math.min(elapsed / state.current.flipDuration, 1);
        
        state.current.rotation = progress * 360 * state.current.direction;
        state.current.yOffset = Math.sin(progress * Math.PI) * 40; // Jump while flipping

        if (progress >= 1) {
          state.current.isFlipping = false;
          state.current.rotation = 0;
          state.current.yOffset = 0;
          if (state.current.flipResolve) {
            state.current.flipResolve();
            state.current.flipResolve = null;
          }
        }
      }

      // Apply DOM Updates
      if (armLRef.current) { armLRef.current.setAttribute('x2', String(armLx)); armLRef.current.setAttribute('y2', String(armLy)); }
      if (armRRef.current) { armRRef.current.setAttribute('x2', String(armRx)); armRRef.current.setAttribute('y2', String(armRy)); }
      if (legLRef.current) { legLRef.current.setAttribute('x2', String(legLx)); legLRef.current.setAttribute('y2', String(legLy)); }
      if (legRRef.current) { legRRef.current.setAttribute('x2', String(legRx)); legRRef.current.setAttribute('y2', String(legRy)); }

      if (groupRef.current) {
        groupRef.current.setAttribute('transform', `translate(${state.current.x}, ${100 - state.current.yOffset})`);
      }
      if (bodyRef.current) {
        bodyRef.current.setAttribute('transform', `scale(${state.current.direction}, 1) rotate(${state.current.rotation}, 0, -15)`);
      }

      reqId = requestAnimationFrame(loop);
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  return (
    <g ref={groupRef} transform={`translate(${initialX}, 100)`}>
      {/* Speech Bubble */}
      {speech && (
        <g transform="translate(-50, -80)">
          <rect width="100" height="30" rx="5" fill="white" stroke="black" strokeWidth="1.5" />
          <text x="50" y="20" fontSize="12" fill="black" textAnchor="middle" fontWeight="500">
            {speech}
          </text>
        </g>
      )}

      {/* Stickman Body */}
      <g ref={bodyRef}>
        <circle cx="0" cy="-40" r="10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="0" y1="-30" x2="0" y2="0" stroke={color} strokeWidth="2" />
        <line ref={armLRef} x1="0" y1="-20" x2="-20" y2="-10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armRRef} x1="0" y1="-20" x2="20" y2="-10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legLRef} x1="0" y1="0" x2="-15" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legRRef} x1="0" y1="0" x2="15" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
});

// --- Default Story Script ---
const defaultScript = [
  [
    { "actor": "A", "action": "move", "x": 200, "duration": 1500 },
    { "actor": "B", "action": "move", "x": 400, "duration": 1500 }
  ],
  [
    { "actor": "A", "action": "wave", "duration": 1500 },
    { "actor": "A", "action": "speak", "text": "Hey there!", "duration": 1500 }
  ],
  [
    { "actor": "B", "action": "speak", "text": "Watch this!", "duration": 1500 }
  ],
  [
    { "actor": "B", "action": "flip", "duration": 800 }
  ],
  [
    { "actor": "A", "action": "speak", "text": "Wow! My turn!", "duration": 1500 }
  ],
  [
    { "actor": "A", "action": "dance", "duration": 2000 }
  ],
  [
    { "actor": "A", "action": "move", "x": 350, "duration": 800 },
    { "actor": "A", "action": "speak", "text": "Take this!", "duration": 1000 }
  ],
  [
    { "actor": "A", "action": "attack", "duration": 300 },
    { "actor": "B", "action": "move", "x": 450, "duration": 200 },
    { "actor": "B", "action": "speak", "text": "Ouch!", "duration": 1000 }
  ],
  [
    { "actor": "B", "action": "move", "x": 550, "duration": 1000 },
    { "actor": "A", "action": "dance", "duration": 2000 },
    { "actor": "A", "action": "speak", "text": "I win!", "duration": 2000 }
  ]
];

// --- Main App ---
export default function App() {
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultScript, null, 2));
  const [prompt, setPrompt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resetCount, setResetCount] = useState(0);
  
  const actorRefs = useRef<Record<string, StickmanHandle | null>>({});
  const playIdRef = useRef(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a stickman animation script based on this request: "${prompt}". 
        The stage is 600px wide. Actor A (Blue) starts at x:50, Actor B (Red) starts at x:550.
        Available actions: move(requires x), jump, speak(requires text), attack, wave, dance, flip.
        Group actions in inner arrays if they should happen at the same time. Make it creative!`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of steps. Each step is an array of actions that happen simultaneously.",
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actor: { type: Type.STRING, description: "Actor ID: 'A' or 'B'" },
                  action: { type: Type.STRING, description: "Action type: move, jump, speak, attack, wave, dance, flip" },
                  x: { type: Type.NUMBER, description: "Target X coordinate for move (0-600)" },
                  text: { type: Type.STRING, description: "Text for speak action" },
                  duration: { type: Type.NUMBER, description: "Duration in ms (e.g., 500, 1000, 2000)" }
                },
                required: ["actor", "action"]
              }
            }
          }
        }
      });
      
      const generatedJson = response.text;
      if (generatedJson) {
        const parsed = JSON.parse(generatedJson);
        setJsonText(JSON.stringify(parsed, null, 2));
        handleReset(); // Reset stage for the new story
      }
    } catch (err: any) {
      setError('AI Generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    try {
      const script = JSON.parse(jsonText);
      setError('');
      setIsPlaying(true);
      
      playIdRef.current += 1;
      const currentPlayId = playIdRef.current;

      for (const step of script) {
        if (currentPlayId !== playIdRef.current) break; // Abort if reset or re-played

        const promises = step.map(async (act: any) => {
          const actor = actorRefs.current[act.actor];
          if (!actor) return;

          switch (act.action) {
            case 'move': await actor.moveTo(act.x, act.duration || 1000); break;
            case 'jump': await actor.jump(act.duration || 800); break;
            case 'speak': await actor.speak(act.text, act.duration || 1500); break;
            case 'attack': await actor.attack(act.duration || 400); break;
            case 'wave': await actor.wave(act.duration || 1500); break;
            case 'dance': await actor.dance(act.duration || 2000); break;
            case 'flip': await actor.flip(act.duration || 800); break;
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
    playIdRef.current += 1; // Abort current playback
    setIsPlaying(false);
    setResetCount(c => c + 1); // Remount SVG to reset state
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Stage Area */}
        <div className="relative bg-gray-50 border-b border-gray-200 p-6 flex justify-center">
          <svg key={resetCount} viewBox="0 0 600 200" className="w-full max-w-3xl bg-white border border-gray-200 rounded-lg shadow-inner">
            {/* Floor */}
            <line x1="0" y1="130" x2="600" y2="130" stroke="#e5e7eb" strokeWidth="2" />
            
            {/* Actors */}
            <Stickman id="A" initialX={50} color="#3b82f6" ref={(el) => actorRefs.current['A'] = el} />
            <Stickman id="B" initialX={550} color="#ef4444" ref={(el) => actorRefs.current['B'] = el} />
          </svg>
        </div>

        {/* AI Prompt Area */}
        <div className="p-6 border-b border-gray-200 bg-blue-50/30">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <Sparkles size={16} />
                AI Director: Describe a scene
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A walks to the center, B jumps over A, then they both dance."
                className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGenerating ? (
                <><RotateCcw size={18} className="animate-spin" /> Generating...</>
              ) : (
                <><Wand2 size={18} /> Generate Script</>
              )}
            </button>
          </div>
        </div>

        {/* Controls & Editor */}
        <div className="p-6 flex flex-col md:flex-row gap-6 bg-white">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Code size={18} className="text-gray-500" /> 
                Story Script (JSON)
              </h3>
              {error && <span className="text-red-500 text-sm font-medium">{error}</span>}
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              disabled={isPlaying}
              className="w-full h-72 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-80 resize-none shadow-inner"
              spellCheck={false}
            />
          </div>
          
          <div className="w-full md:w-56 flex flex-col gap-4">
            <button 
              onClick={handlePlay} 
              disabled={isPlaying} 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} fill="currentColor" /> {isPlaying ? 'Playing...' : 'Play Story'}
            </button>
            
            <button 
              onClick={handleReset} 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw size={18} /> Reset Stage
            </button>

            <div className="mt-auto p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Available Actions</p>
              <ul className="text-sm text-gray-600 space-y-2 font-mono text-xs">
                <li><span className="text-blue-600 font-bold">move</span>(x, dur)</li>
                <li><span className="text-blue-600 font-bold">jump</span>(dur)</li>
                <li><span className="text-blue-600 font-bold">speak</span>(text, dur)</li>
                <li><span className="text-blue-600 font-bold">attack</span>(dur)</li>
                <li><span className="text-blue-600 font-bold">wave</span>(dur)</li>
                <li><span className="text-blue-600 font-bold">dance</span>(dur)</li>
                <li><span className="text-blue-600 font-bold">flip</span>(dur)</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
