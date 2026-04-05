import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

export class MoveAction extends Action {
  startX: number = 0;
  targetX: number;
  speed: number;
  constructor(params: any, time: number) {
    const speed = params.speed || 1;
    super('move', time, (params.duration || 1000) / speed);
    this.targetX = params.x;
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
