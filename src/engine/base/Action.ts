import { Actor } from './Entity';
import { World } from '../World';

export abstract class Action {
  type: string;
  startTime: number;
  duration: number;
  priority: number;
  resolve: (() => void) | null = null;

  constructor(type: string, startTime: number, duration: number, priority: number = 1) {
    this.type = type;
    this.startTime = startTime;
    this.duration = duration;
    this.priority = priority;
  }

  update(actor: Actor, world: World, time: number, dt: number): boolean {
    const elapsed = time - this.startTime;
    const progress = this.duration > 0 ? Math.min(elapsed / this.duration, 1) : 1;
    
    this.onUpdate(actor, world, progress, dt, time);
    
    if (progress >= 1) {
      if (this.resolve) this.resolve();
      return true;
    }
    return false;
  }

  abstract onUpdate(actor: Actor, world: World, progress: number, dt: number, time: number): void;
}
