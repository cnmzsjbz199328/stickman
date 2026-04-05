import React, { useEffect, useRef, useState } from 'react';
import { Actor } from '../engine/World';
import { AnimationSystem, defaultPose, Pose } from '../engine/AnimationSystem';
import { Animations } from '../engine/Animations';

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

interface StickmanProps {
  actor: Actor;
}

export const Stickman: React.FC<StickmanProps> = ({ actor }) => {
  const groupRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  
  const armL1Ref = useRef<SVGLineElement>(null);
  const armL2Ref = useRef<SVGLineElement>(null);
  const armR1Ref = useRef<SVGLineElement>(null);
  const armR2Ref = useRef<SVGLineElement>(null);
  const legL1Ref = useRef<SVGLineElement>(null);
  const legL2Ref = useRef<SVGLineElement>(null);
  const legR1Ref = useRef<SVGLineElement>(null);
  const legR2Ref = useRef<SVGLineElement>(null);

  const [speech, setSpeech] = useState('');

  useEffect(() => {
    (actor as any).speak = (text: string, duration: number = 1500) => new Promise<void>((resolve) => {
      setSpeech(text);
      setTimeout(() => {
        setSpeech('');
        resolve();
      }, duration);
    });
  }, [actor]);

  useEffect(() => {
    let reqId: number;

    const renderLoop = (time: number) => {
      const moveAction = actor.actions.find(a => a.type === 'move');
      const attackAction = actor.actions.find(a => a.type === 'attack');
      const jumpAction = actor.actions.find(a => a.type === 'jump');
      const hitAction = actor.actions.find(a => a.type === 'hit');
      const waveAction = actor.actions.find(a => a.type === 'wave');
      const danceAction = actor.actions.find(a => a.type === 'dance');
      const flipAction = actor.actions.find(a => a.type === 'flip');

      // 1. Base Layer (Idle or Walk)
      let currentPose: Pose;
      if (moveAction) {
        // Loop walk animation based on actor.t
        const walkProgress = (actor.t / (Math.PI * 2)) % 1;
        currentPose = AnimationSystem.evaluate(Animations.walk, walkProgress);
      } else {
        const idleProgress = (time % 2000) / 2000;
        currentPose = AnimationSystem.evaluate(Animations.idle, idleProgress);
      }

      // 2. Full Body Overrides
      if (danceAction) {
        const progress = ((time - danceAction.startTime) % danceAction.duration) / danceAction.duration;
        const dancePose = AnimationSystem.evaluate(Animations.dance, progress);
        currentPose = AnimationSystem.blend(currentPose, dancePose, 1);
      }
      
      if (jumpAction) {
        const progress = Math.min((time - jumpAction.startTime) / jumpAction.duration, 1);
        const jumpPose = AnimationSystem.evaluate(Animations.jump, progress);
        // Blend lower body and scale
        currentPose = AnimationSystem.blend(currentPose, {
          scaleY: jumpPose.scaleY,
          legUpperL: jumpPose.legUpperL, legLowerL: jumpPose.legLowerL,
          legUpperR: jumpPose.legUpperR, legLowerR: jumpPose.legLowerR
        }, 1);
        
        // Only blend arms if not attacking/waving
        if (!attackAction && !waveAction) {
          currentPose = AnimationSystem.blend(currentPose, {
            armUpperL: jumpPose.armUpperL, armLowerL: jumpPose.armLowerL,
            armUpperR: jumpPose.armUpperR, armLowerR: jumpPose.armLowerR
          }, 1);
        }
      }

      if (flipAction) {
        const progress = Math.min((time - flipAction.startTime) / flipAction.duration, 1);
        const flipPose = AnimationSystem.evaluate(Animations.flip, progress);
        // Apply flip rotation with direction
        currentPose = AnimationSystem.blend(currentPose, {
          bodyRotation: flipPose.bodyRotation * actor.direction,
          legUpperL: flipPose.legUpperL, legLowerL: flipPose.legLowerL,
          legUpperR: flipPose.legUpperR, legLowerR: flipPose.legLowerR
        }, 1);
      }

      if (hitAction) {
        const progress = Math.min((time - hitAction.startTime) / hitAction.duration, 1);
        const hitPose = AnimationSystem.evaluate(Animations.hit, progress);
        currentPose = AnimationSystem.blend(currentPose, {
          bodyRotation: hitPose.bodyRotation * actor.direction,
          armUpperL: hitPose.armUpperL, armUpperR: hitPose.armUpperR
        }, 1);
      }

      // 3. Upper Body Overrides
      if (attackAction) {
        const progress = Math.min((time - attackAction.startTime) / attackAction.duration, 1);
        const attackPose = AnimationSystem.evaluate(Animations.attack, progress);
        currentPose = AnimationSystem.blend(currentPose, {
          armUpperR: attackPose.armUpperR, armLowerR: attackPose.armLowerR,
          bodyRotation: attackPose.bodyRotation
        }, 1);
      }
      
      if (waveAction) {
        const progress = Math.min((time - waveAction.startTime) / waveAction.duration, 1);
        const wavePose = AnimationSystem.evaluate(Animations.wave, progress);
        currentPose = AnimationSystem.blend(currentPose, {
          armUpperR: wavePose.armUpperR, armLowerR: wavePose.armLowerR
        }, 1);
      }

      const shoulderX = 0, shoulderY = -30;
      const hipX = 0, hipY = 0;
      const armLen = 14, legLen = 18;

      const elbowL = getEnd(shoulderX, shoulderY, currentPose.armUpperL, armLen);
      const handL = getEnd(elbowL.x, elbowL.y, currentPose.armLowerL, armLen);
      const elbowR = getEnd(shoulderX, shoulderY, currentPose.armUpperR, armLen);
      const handR = getEnd(elbowR.x, elbowR.y, currentPose.armLowerR, armLen);
      const kneeL = getEnd(hipX, hipY, currentPose.legUpperL, legLen);
      const footL = getEnd(kneeL.x, kneeL.y, currentPose.legLowerL, legLen);
      const kneeR = getEnd(hipX, hipY, currentPose.legUpperR, legLen);
      const footR = getEnd(kneeR.x, kneeR.y, currentPose.legLowerR, legLen);

      updateLine(armL1Ref, shoulderX, shoulderY, elbowL.x, elbowL.y);
      updateLine(armL2Ref, elbowL.x, elbowL.y, handL.x, handL.y);
      updateLine(armR1Ref, shoulderX, shoulderY, elbowR.x, elbowR.y);
      updateLine(armR2Ref, elbowR.x, elbowR.y, handR.x, handR.y);
      updateLine(legL1Ref, hipX, hipY, kneeL.x, kneeL.y);
      updateLine(legL2Ref, kneeL.x, kneeL.y, footL.x, footL.y);
      updateLine(legR1Ref, hipX, hipY, kneeR.x, kneeR.y);
      updateLine(legR2Ref, kneeR.x, kneeR.y, footR.x, footR.y);

      if (groupRef.current) {
        groupRef.current.setAttribute('transform', `translate(${actor.x}, ${actor.y + currentPose.bounce - 18})`);
      }
      if (bodyRef.current) {
        bodyRef.current.setAttribute('transform', `scale(${actor.direction}, ${currentPose.scaleY}) rotate(${currentPose.bodyRotation}, 0, -15)`);
      }

      reqId = requestAnimationFrame(renderLoop);
    };

    reqId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(reqId);
  }, [actor]);

  return (
    <g ref={groupRef} transform={`translate(${actor.x}, ${actor.y})`}>
      {speech && (
        <g transform="translate(-50, -80)">
          <rect width="100" height="30" rx="5" fill="white" stroke="black" strokeWidth="1.5" />
          <text x="50" y="20" fontSize="12" fill="black" textAnchor="middle" fontWeight="500">
            {speech}
          </text>
        </g>
      )}
      <g ref={bodyRef}>
        <circle cx="0" cy="-40" r="10" stroke={actor.color} strokeWidth="2" fill="none" />
        <line x1="0" y1="-30" x2="0" y2="0" stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armL1Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armL2Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armR1Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={armR2Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legL1Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legL2Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legR1Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
        <line ref={legR2Ref} stroke={actor.color} strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
};
