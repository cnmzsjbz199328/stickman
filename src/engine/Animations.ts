import { AnimationData } from './AnimationSystem';

const PI = Math.PI;

export const Animations: Record<string, AnimationData> = {
  idle: {
    name: 'idle',
    keyframes: [
      { t: 0, pose: { bounce: 0, armUpperL: PI/2 - 0.1, armUpperR: PI/2 + 0.1 } },
      { t: 0.5, pose: { bounce: 1.5, armUpperL: PI/2 - 0.15, armUpperR: PI/2 + 0.15 }, ease: 'easeInOut' },
      { t: 1, pose: { bounce: 0, armUpperL: PI/2 - 0.1, armUpperR: PI/2 + 0.1 }, ease: 'easeInOut' }
    ]
  },
  walk: {
    name: 'walk',
    keyframes: [
      { t: 0, pose: { 
        legUpperR: PI/2, legLowerR: PI/2, 
        legUpperL: PI/2, legLowerL: PI/2,
        armUpperR: PI/2, armLowerR: PI/2,
        armUpperL: PI/2, armLowerL: PI/2,
        bounce: 4
      }},
      { t: 0.25, pose: { 
        legUpperR: PI/2 - 0.8, legLowerR: PI/2 - 0.8 + 1.5, 
        legUpperL: PI/2 + 0.8, legLowerL: PI/2 + 0.8,
        armUpperR: PI/2 + 0.8, armLowerR: PI/2 + 0.8 - 1.5,
        armUpperL: PI/2 - 0.8, armLowerL: PI/2 - 0.8,
        bounce: 0
      }, ease: 'easeInOut' },
      { t: 0.5, pose: { 
        legUpperR: PI/2, legLowerR: PI/2, 
        legUpperL: PI/2, legLowerL: PI/2,
        armUpperR: PI/2, armLowerR: PI/2,
        armUpperL: PI/2, armLowerL: PI/2,
        bounce: 4
      }, ease: 'easeInOut' },
      { t: 0.75, pose: { 
        legUpperR: PI/2 + 0.8, legLowerR: PI/2 + 0.8, 
        legUpperL: PI/2 - 0.8, legLowerL: PI/2 - 0.8 + 1.5,
        armUpperR: PI/2 - 0.8, armLowerR: PI/2 - 0.8,
        armUpperL: PI/2 + 0.8, armLowerL: PI/2 + 0.8 - 1.5,
        bounce: 0
      }, ease: 'easeInOut' },
      { t: 1, pose: { 
        legUpperR: PI/2, legLowerR: PI/2, 
        legUpperL: PI/2, legLowerL: PI/2,
        armUpperR: PI/2, armLowerR: PI/2,
        armUpperL: PI/2, armLowerL: PI/2,
        bounce: 4
      }, ease: 'easeInOut' }
    ]
  },
  attack: {
    name: 'attack',
    keyframes: [
      { t: 0, pose: { armUpperR: PI/2, armLowerR: PI/2, bodyRotation: 0 } },
      { t: 0.2, pose: { armUpperR: PI/2 + 1, armLowerR: PI/2 + 2, bodyRotation: -10 }, ease: 'easeOut' },
      { t: 0.4, pose: { armUpperR: PI/2 - 2.5, armLowerR: PI/2 - 2, bodyRotation: 15 }, ease: 'easeIn' },
      { t: 0.8, pose: { armUpperR: PI/2 - 2.5, armLowerR: PI/2 - 2, bodyRotation: 15 } },
      { t: 1, pose: { armUpperR: PI/2, armLowerR: PI/2, bodyRotation: 0 }, ease: 'easeInOut' }
    ]
  },
  jump: {
    name: 'jump',
    keyframes: [
      { t: 0, pose: { scaleY: 1, legUpperR: PI/2, legLowerR: PI/2, legUpperL: PI/2, legLowerL: PI/2, armUpperR: PI/2, armUpperL: PI/2 } },
      { t: 0.2, pose: { scaleY: 0.8, legUpperR: PI/2 + 0.5, legLowerR: PI/2 + 1.5, legUpperL: PI/2 + 0.5, legLowerL: PI/2 + 1.5, armUpperR: PI/2 + 1, armUpperL: PI/2 - 1 }, ease: 'easeOut' },
      { t: 0.4, pose: { scaleY: 1.1, legUpperR: PI/2 - 0.5, legLowerR: PI/2 + 1, legUpperL: PI/2 + 0.2, legLowerL: PI/2 + 1.7, armUpperR: PI/2 - 2.5, armUpperL: PI/2 + 2.5 }, ease: 'easeIn' },
      { t: 0.8, pose: { scaleY: 1, legUpperR: PI/2 - 0.5, legLowerR: PI/2 + 1, legUpperL: PI/2 + 0.2, legLowerL: PI/2 + 1.7, armUpperR: PI/2 - 2.5, armUpperL: PI/2 + 2.5 } },
      { t: 1, pose: { scaleY: 1, legUpperR: PI/2, legLowerR: PI/2, legUpperL: PI/2, legLowerL: PI/2, armUpperR: PI/2, armUpperL: PI/2 }, ease: 'easeInOut' }
    ]
  },
  hit: {
    name: 'hit',
    keyframes: [
      { t: 0, pose: { bodyRotation: 0, armUpperR: PI/2, armUpperL: PI/2 } },
      { t: 0.2, pose: { bodyRotation: -20, armUpperR: PI/2 - 2, armUpperL: PI/2 + 2 }, ease: 'easeOut' },
      { t: 0.8, pose: { bodyRotation: -20, armUpperR: PI/2 - 2, armUpperL: PI/2 + 2 } },
      { t: 1, pose: { bodyRotation: 0, armUpperR: PI/2, armUpperL: PI/2 }, ease: 'easeInOut' }
    ]
  },
  wave: {
    name: 'wave',
    keyframes: [
      { t: 0, pose: { armUpperR: PI/2, armLowerR: PI/2 } },
      { t: 0.2, pose: { armUpperR: -PI/2 + 0.5, armLowerR: -PI/2 + 0.5 }, ease: 'easeInOut' },
      { t: 0.4, pose: { armUpperR: -PI/2 + 0.5, armLowerR: -PI/2 + 1.3 }, ease: 'easeInOut' },
      { t: 0.6, pose: { armUpperR: -PI/2 + 0.5, armLowerR: -PI/2 - 0.3 }, ease: 'easeInOut' },
      { t: 0.8, pose: { armUpperR: -PI/2 + 0.5, armLowerR: -PI/2 + 1.3 }, ease: 'easeInOut' },
      { t: 1, pose: { armUpperR: PI/2, armLowerR: PI/2 }, ease: 'easeInOut' }
    ]
  },
  flip: {
    name: 'flip',
    keyframes: [
      { t: 0, pose: { bodyRotation: 0, legUpperR: PI/2, legLowerR: PI/2, legUpperL: PI/2, legLowerL: PI/2 } },
      { t: 0.2, pose: { bodyRotation: 90, legUpperR: PI/2 - 1.0, legLowerR: PI/2 + 1.0, legUpperL: PI/2 - 0.5, legLowerL: PI/2 + 1.5 }, ease: 'easeIn' },
      { t: 0.8, pose: { bodyRotation: 270, legUpperR: PI/2 - 1.0, legLowerR: PI/2 + 1.0, legUpperL: PI/2 - 0.5, legLowerL: PI/2 + 1.5 }, ease: 'linear' },
      { t: 1, pose: { bodyRotation: 360, legUpperR: PI/2, legLowerR: PI/2, legUpperL: PI/2, legLowerL: PI/2 }, ease: 'easeOut' }
    ]
  },
  dance: {
    name: 'dance',
    keyframes: [
      { t: 0, pose: { armUpperR: PI/2, armUpperL: PI/2, legUpperR: PI/2, legUpperL: PI/2, bounce: 0 } },
      { t: 0.25, pose: { armUpperR: PI/2 + 2, armUpperL: PI/2 - 2, legUpperR: PI/2 - 0.5, legUpperL: PI/2 + 0.5, bounce: 6 }, ease: 'easeInOut' },
      { t: 0.5, pose: { armUpperR: PI/2, armUpperL: PI/2, legUpperR: PI/2, legUpperL: PI/2, bounce: 0 }, ease: 'easeInOut' },
      { t: 0.75, pose: { armUpperR: PI/2 - 2, armUpperL: PI/2 + 2, legUpperR: PI/2 + 0.5, legUpperL: PI/2 - 0.5, bounce: 6 }, ease: 'easeInOut' },
      { t: 1, pose: { armUpperR: PI/2, armUpperL: PI/2, legUpperR: PI/2, legUpperL: PI/2, bounce: 0 }, ease: 'easeInOut' }
    ]
  }
};
