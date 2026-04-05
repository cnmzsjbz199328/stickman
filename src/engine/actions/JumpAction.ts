import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

export class JumpAction extends Action {
  heightMult: number;
  constructor(params: any, time: number) {
    super('jump', time, params.duration || 800);
    this.heightMult = params.height || 1;
  }
  onUpdate(actor: Actor, world: World, progress: number) {
    if (progress === 0) {
      actor.vy = -800 * Math.sqrt(this.heightMult);
    }
  }
}
