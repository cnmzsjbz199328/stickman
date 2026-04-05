import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

export class WaveAction extends Action {
  constructor(params: any, time: number) { 
    super('wave', time, (params.duration || 1500) / (params.speed || 1)); 
  }
  onUpdate() {}
}

export class DanceAction extends Action {
  constructor(params: any, time: number) { 
    super('dance', time, params.duration || 2000); 
  }
  onUpdate() {}
}

export class FlipAction extends Action {
  constructor(params: any, time: number) { 
    super('flip', time, params.duration || 800); 
  }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress === 0) actor.vy = -600;
  }
}
