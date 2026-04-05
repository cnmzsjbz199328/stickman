import { World, Actor } from './World';
import { Action } from './base/Action';


class MoveAction extends Action {
  startX: number = 0;
  targetX: number;
  speed: number;
  constructor(targetX: number, startTime: number, duration: number, speed: number = 1) {
    super('move', startTime, duration / speed);
    this.targetX = targetX;
    this.speed = speed;
  }
  onUpdate(actor: Actor, world: World, progress: number, dt: number) {
    if (progress === 0) {
      this.startX = actor.x;
      actor.direction = this.targetX > actor.x ? 1 : -1;
    }
    actor.x = this.startX + (this.targetX - this.startX) * progress;
    actor.t += dt * 0.015 * this.speed;
  }
}

class JumpAction extends Action {
  heightMult: number;
  constructor(startTime: number, duration: number, height: number = 1) {
    super('jump', startTime, duration);
    this.heightMult = height;
  }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress === 0) {
      actor.vy = -800 * Math.sqrt(this.heightMult);
    }
  }
}

class AttackAction extends Action {
  hasHit: boolean = false;
  forceMult: number;
  constructor(startTime: number, duration: number, speed: number = 1, force: number = 1) {
    super('attack', startTime, duration / speed);
    this.forceMult = force;
  }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress > 0.3 && progress < 0.7 && !this.hasHit) {
      this.hasHit = true;
      world.hitboxes.push({
        x: actor.x + actor.direction * 30,
        y: actor.y - 40,
        width: 60,
        height: 40,
        ownerId: actor.id,
        direction: actor.direction,
        force: 60 * this.forceMult
      });
    }
  }
}

class HitAction extends Action {
  knockbackStart: number = 0;
  knockbackTarget: number;
  constructor(force: number, startTime: number, duration: number) {
    super('hit', startTime, duration);
    this.knockbackTarget = force;
  }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress === 0) {
      this.knockbackStart = actor.x;
      this.knockbackTarget = actor.x + this.knockbackTarget;
      // Cancel other actions when hit
      actor.actions = actor.actions.filter(a => a === this);
    }
    const easeOut = 1 - Math.pow(1 - progress, 3);
    actor.x = this.knockbackStart + (this.knockbackTarget - this.knockbackStart) * easeOut;
  }
}

class WaveAction extends Action {
  constructor(startTime: number, duration: number, speed: number = 1) { super('wave', startTime, duration / speed); }
  onUpdate() {}
}

class DanceAction extends Action {
  constructor(startTime: number, duration: number) { super('dance', startTime, duration); }
  onUpdate() {}
}

class FlipAction extends Action {
  constructor(startTime: number, duration: number) { super('flip', startTime, duration); }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress === 0) actor.vy = -600;
  }
}

export class ActionSystem {
  static update(world: World, time: number, dt: number) {
    for (const actor of world.getActors()) {
      actor.actions = actor.actions.filter(action => !action.update(actor, world, time, dt));
      
      if (actor.actions.length === 0) {
        actor.t = 0; // reset walk cycle
      }
    }
  }

  static triggerHit(actor: Actor, force: number, time: number) {
    const hit = new HitAction(force, time, 400);
    actor.actions.push(hit);
  }

  static execute(actor: Actor, type: string, params: any, time: number): Promise<void> {
    return new Promise(resolve => {
      let action: Action | null = null;
      switch (type) {
        case 'move': action = new MoveAction(params.x, time, params.duration || 1000, params.speed || 1); break;
        case 'jump': action = new JumpAction(time, params.duration || 800, params.height || 1); break;
        case 'attack': action = new AttackAction(time, params.duration || 400, params.speed || 1, params.force || 1); break;
        case 'wave': action = new WaveAction(time, params.duration || 1500, params.speed || 1); break;
        case 'dance': action = new DanceAction(time, params.duration || 2000); break;
        case 'flip': action = new FlipAction(time, params.duration || 800); break;
      }
      if (action) {
        action.resolve = resolve;
        actor.actions.push(action);
      } else {
        resolve();
      }
    });
  }
}
