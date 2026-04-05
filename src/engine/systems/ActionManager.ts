import { Actor } from '../base/Entity';
import { Action } from '../base/Action';

export class ActionManager {
  /**
   * Pushes a new action safely, resolving conflicts based on priority.
   * Actions with lower priority are canceled and removed from the queue.
   */
  static pushAction(actor: Actor, newAction: Action) {
    const interruptableActions = actor.actions.filter(a => a.priority < newAction.priority);
    for (const a of interruptableActions) {
      if (a.resolve) a.resolve(); // Ensure promise is completed
    }
    
    // Retain only equal or higher priority actions
    actor.actions = actor.actions.filter(a => a.priority >= newAction.priority);
    actor.actions.push(newAction);
  }
}
