import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Play, RotateCcw, Code, Sparkles, Wand2 } from 'lucide-react';

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

// --- Helper Math ---
const getEnd = (x: number, y: number, angle: number, len: number) => ({
  x: x + Math.cos(angle) * len,
  y: y + Math.sin(angle) * len
});

const updateLine = (ref: React.RefObject<SVGLineElement | null>, x1: number, y1: number, x2: number, y2: number) => {
  if (ref.current) {
    ref.current.setAttribute('x1', x1.toFixed(2));
    ref.current.setAttribute('y1', y1.toFixed(2));
    ref.current.setAttribute('x2', x2.toFixed(2));
    ref.current.setAttribute('y2', y2.toFixed(2));
  }
};

// --- Stickman Component (Skeletal Engine) ---
const Stickman = forwardRef<StickmanHandle, StickmanProps>(({ id, initialX, color = 'black' }, ref) => {
  const groupRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  
  // 8-part limb system (Upper/Lower for each arm/leg)
  const armL1Ref = useRef<SVGLineElement>(null);
  const armL2Ref = useRef<SVGLineElement>(null);
  const armR1Ref = useRef<SVGLineElement>(null);
  const armR2Ref = useRef<SVGLineElement>(null);
  const legL1Ref = useRef<SVGLineElement>(null);
  const legL2Ref = useRef<SVGLineElement>(null);
  const legR1Ref = useRef<SVGLineElement>(null);
  const legR2Ref = useRef<SVGLineElement>(null);
  
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

      // --- 1. State Machine & Kinematics ---
      // Default Angles (Straight down = PI/2)
      let armUpperL_angle = Math.PI / 2;
      let armLowerL_angle = Math.PI / 2;
      let armUpperR_angle = Math.PI / 2;
      let armLowerR_angle = Math.PI / 2;
      let legUpperL_angle = Math.PI / 2;
      let legLowerL_angle = Math.PI / 2;
      let legUpperR_angle = Math.PI / 2;
      let legLowerR_angle = Math.PI / 2;
      
      let bounce = 0;
      let bodyRotation = 0;
      let scaleY = 1;

      // Base State: Idle vs Walk vs Dance
      if (state.current.isWalking) {
        const elapsed = time - state.current.walkStartTime;
        const progress = Math.min(elapsed / state.current.walkDuration, 1);
        state.current.x = state.current.walkStart + (state.current.walkTarget - state.current.walkStart) * progress;
        state.current.t += dt * 0.015; 
        const cycle = state.current.t;
        const swing = Math.sin(cycle);

        // Legs (FK)
        legUpperR_angle = Math.PI/2 - swing * 0.8;
        legLowerR_angle = legUpperR_angle + Math.max(0, swing * 1.5); // Knee bends back
        legUpperL_angle = Math.PI/2 + swing * 0.8;
        legLowerL_angle = legUpperL_angle + Math.max(0, -swing * 1.5);

        // Arms (Opposite to legs)
        armUpperR_angle = Math.PI/2 + swing * 0.8;
        armLowerR_angle = armUpperR_angle - Math.max(0, swing * 1.5); // Elbow bends forward
        armUpperL_angle = Math.PI/2 - swing * 0.8;
        armLowerL_angle = armUpperL_angle - Math.max(0, -swing * 1.5);

        bounce = Math.abs(Math.cos(cycle)) * 4; // Center of mass bobbing

        if (progress >= 1) {
          state.current.isWalking = false;
          if (state.current.walkResolve) { state.current.walkResolve(); state.current.walkResolve = null; }
        }
      } else if (state.current.isDancing) {
        const elapsed = time - state.current.danceStartTime;
        const progress = Math.min(elapsed / state.current.danceDuration, 1);
        const d = time * 0.01;
        
        armUpperR_angle = Math.PI/2 + Math.sin(d) * 2;
        armLowerR_angle = armUpperR_angle - 1;
        armUpperL_angle = Math.PI/2 + Math.cos(d) * 2;
        armLowerL_angle = armUpperL_angle - 1;
        
        legUpperR_angle = Math.PI/2 - Math.sin(d*2) * 0.5;
        legLowerR_angle = legUpperR_angle + Math.abs(Math.cos(d*2)) * 1.5;
        legUpperL_angle = Math.PI/2 + Math.cos(d*2) * 0.5;
        legLowerL_angle = legUpperL_angle + Math.abs(Math.sin(d*2)) * 1.5;
        
        bounce = Math.abs(Math.sin(d * 4)) * 6;

        if (progress >= 1) {
          state.current.isDancing = false;
          if (state.current.danceResolve) { state.current.danceResolve(); state.current.danceResolve = null; }
        }
      } else {
        // Idle (Breathing)
        state.current.t = 0;
        const breath = Math.sin(time * 0.003);
        armUpperR_angle = Math.PI/2 + 0.1;
        armLowerR_angle = armUpperR_angle - 0.2;
        armUpperL_angle = Math.PI/2 - 0.1;
        armLowerL_angle = armUpperL_angle - 0.2;
        bounce = breath * 1.5;
      }

      // Overrides (Jump, Attack, Wave, Flip)
      if (state.current.isJumping) {
        const elapsed = time - state.current.jumpStartTime;
        const progress = Math.min(elapsed / state.current.jumpDuration, 1);
        state.current.yOffset = Math.sin(progress * Math.PI) * 40; 
        
        // Squash and Stretch
        scaleY = 1 + Math.cos(progress * Math.PI * 2) * 0.1;

        // Tuck limbs
        legUpperR_angle = Math.PI/2 - 0.5; legLowerR_angle = legUpperR_angle + 1.5;
        legUpperL_angle = Math.PI/2 + 0.2; legLowerL_angle = legUpperL_angle + 1.5;
        armUpperR_angle = Math.PI/2 - 2.5; armLowerR_angle = armUpperR_angle - 0.5;
        armUpperL_angle = Math.PI/2 + 2.5; armLowerL_angle = armUpperL_angle - 0.5;

        if (progress >= 1) {
          state.current.isJumping = false;
          state.current.yOffset = 0;
          if (state.current.jumpResolve) { state.current.jumpResolve(); state.current.jumpResolve = null; }
        }
      }

      if (state.current.isAttacking) {
        const elapsed = time - state.current.attackStartTime;
        const progress = Math.min(elapsed / state.current.attackDuration, 1);
        const punch = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
        
        armUpperR_angle = Math.PI/2 - punch * 2.0; // Swing forward
        armLowerR_angle = armUpperR_angle + punch * 0.5; // Straighten out
        bodyRotation = punch * 15; // Lean into punch

        if (progress >= 1) {
          state.current.isAttacking = false;
          if (state.current.attackResolve) { state.current.attackResolve(); state.current.attackResolve = null; }
        }
      }

      if (state.current.isWaving) {
        const elapsed = time - state.current.waveStartTime;
        const progress = Math.min(elapsed / state.current.waveDuration, 1);
        
        armUpperR_angle = -Math.PI/2 + 0.5; // Arm up
        armLowerR_angle = armUpperR_angle + Math.sin(progress * Math.PI * 8) * 0.8; // Wave

        if (progress >= 1) {
          state.current.isWaving = false;
          if (state.current.waveResolve) { state.current.waveResolve(); state.current.waveResolve = null; }
        }
      }

      if (state.current.isFlipping) {
        const elapsed = time - state.current.flipStartTime;
        const progress = Math.min(elapsed / state.current.flipDuration, 1);
        
        state.current.rotation = progress * 360 * state.current.direction;
        state.current.yOffset = Math.sin(progress * Math.PI) * 50; 
        
        // Tuck tight for flip
        legUpperR_angle = Math.PI/2 - 1.0; legLowerR_angle = legUpperR_angle + 2.0;
        legUpperL_angle = Math.PI/2 - 0.5; legLowerL_angle = legUpperL_angle + 2.0;

        if (progress >= 1) {
          state.current.isFlipping = false;
          state.current.rotation = 0;
          state.current.yOffset = 0;
          if (state.current.flipResolve) { state.current.flipResolve(); state.current.flipResolve = null; }
        }
      }

      // --- 2. Forward Kinematics (FK) Solver ---
      const shoulderX = 0, shoulderY = -30;
      const hipX = 0, hipY = 0;
      const armLen = 14, legLen = 18;

      const elbowL = getEnd(shoulderX, shoulderY, armUpperL_angle, armLen);
      const handL = getEnd(elbowL.x, elbowL.y, armLowerL_angle, armLen);

      const elbowR = getEnd(shoulderX, shoulderY, armUpperR_angle, armLen);
      const handR = getEnd(elbowR.x, elbowR.y, armLowerR_angle, armLen);

      const kneeL = getEnd(hipX, hipY, legUpperL_angle, legLen);
      const footL = getEnd(kneeL.x, kneeL.y, legLowerL_angle, legLen);

      const kneeR = getEnd(hipX, hipY, legUpperR_angle, legLen);
      const footR = getEnd(kneeR.x, kneeR.y, legLowerR_angle, legLen);

      // --- 3. DOM Updates ---
      updateLine(armL1Ref, shoulderX, shoulderY, elbowL.x, elbowL.y);
      updateLine(armL2Ref, elbowL.x, elbowL.y, handL.x, handL.y);
      updateLine(armR1Ref, shoulderX, shoulderY, elbowR.x, elbowR.y);
      updateLine(armR2Ref, elbowR.x, elbowR.y, handR.x, handR.y);
      
      updateLine(legL1Ref, hipX, hipY, kneeL.x, kneeL.y);
      updateLine(legL2Ref, kneeL.x, kneeL.y, footL.x, footL.y);
      updateLine(legR1Ref, hipX, hipY, kneeR.x, kneeR.y);
      updateLine(legR2Ref, kneeR.x, kneeR.y, footR.x, footR.y);

      if (groupRef.current) {
        groupRef.current.setAttribute('transform', `translate(${state.current.x}, ${100 - state.current.yOffset + bounce})`);
      }
      if (bodyRef.current) {
        const totalRot = state.current.rotation + bodyRotation;
        bodyRef.current.setAttribute('transform', `scale(${state.current.direction}, ${scaleY}) rotate(${totalRot}, 0, -15)`);
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

      {/* Stickman Skeletal Body */}
      <g ref={bodyRef}>
        <circle cx="0" cy="-40" r="10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="0" y1="-30" x2="0" y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
        
        {/* Left Arm */}
        <line ref={armL1Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armL2Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        
        {/* Right Arm */}
        <line ref={armR1Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armR2Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        
        {/* Left Leg */}
        <line ref={legL1Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legL2Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        
        {/* Right Leg */}
        <line ref={legR1Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legR2Ref} stroke={color} strokeWidth="2" strokeLinecap="round" />
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
      const promptText = `Generate a stickman animation script based on this request: "${prompt}". 
The stage is 600px wide. Actor A (Blue) starts at x:50, Actor B (Red) starts at x:550.
Available actions: move(requires x), jump, speak(requires text), attack, wave, dance, flip.
Group actions in inner arrays if they should happen at the same time. Make it creative!

IMPORTANT: You MUST return ONLY a valid JSON array of arrays of action objects. Do not include any markdown formatting, backticks, or explanations. Just the raw JSON array.
Example format:
[
  [{"actor": "A", "action": "move", "x": 200, "duration": 1000}],
  [{"actor": "B", "action": "jump", "duration": 800}]
]`;

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
        // Try to extract JSON if the model wrapped it in markdown
        const match = jsonStr.match(/\[[\s\S]*\]/);
        if (match) {
          jsonStr = match[0];
        }
        const parsed = JSON.parse(jsonStr);
        setJsonText(JSON.stringify(parsed, null, 2));
        handleReset(); // Reset stage for the new story
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
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full border border-blue-200 flex items-center gap-1">
                  <Wand2 size={10} />
                  Powered by Llama 3.1
                </span>
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
