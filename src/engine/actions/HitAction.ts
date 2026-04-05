import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

export class HitAction extends Action {
  knockbackStart: number = 0;
  knockbackTarget: number;
  constructor(params: any, time: number) {
    super('hit', time, params.duration || 400);
    this.knockbackTarget = params.force;
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
