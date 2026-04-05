import { World, Actor } from './World';
import { Action } from './base/Action';
import { ActionRegistry } from './actions/ActionRegistry';
import { ActionManager } from './systems/ActionManager';

// We register all built-in actions here or in an index initialization file.
import { MoveAction } from './actions/MoveAction';
import { JumpAction } from './actions/JumpAction';
import { AttackAction } from './actions/AttackAction';
import { HitAction } from './actions/HitAction';
import { WaveAction, DanceAction, FlipAction } from './actions/MiscActions';

ActionRegistry.register('move', MoveAction as any);
ActionRegistry.register('jump', JumpAction as any);
ActionRegistry.register('attack', AttackAction as any);
ActionRegistry.register('hit', HitAction as any);
ActionRegistry.register('wave', WaveAction as any);
ActionRegistry.register('dance', DanceAction as any);
ActionRegistry.register('flip', FlipAction as any);

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
    const hit = ActionRegistry.create('hit', { force }, time);
    if (hit) ActionManager.pushAction(actor, hit);
  }

  static execute(actor: Actor, type: string, params: any, time: number): Promise<void> {
    return new Promise(resolve => {
      const action = ActionRegistry.create(type, params, time);
      if (action) {
        action.resolve = resolve;
        ActionManager.pushAction(actor, action);
      } else {
        resolve();
      }
    });
  }
}
