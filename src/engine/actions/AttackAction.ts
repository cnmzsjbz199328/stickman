import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

export class AttackAction extends Action {
  hasHit: boolean = false;
  forceMult: number;
  constructor(params: any, time: number) {
    super('attack', time, (params.duration || 400) / (params.speed || 1));
    this.forceMult = params.force || 1;
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
