import { Action } from '../base/Action';

export interface ActionConstructor {
  new (...args: any[]): Action;
}

export class ActionRegistry {
  private static registry = new Map<string, ActionConstructor>();

  static register(type: string, actionClass: ActionConstructor) {
    this.registry.set(type, actionClass);
  }

  static create(type: string, ...args: any[]): Action | null {
    const ActionClass = this.registry.get(type);
    if (!ActionClass) {
      console.warn(`Action type "${type}" is not registered.`);
      return null;
    }
    return new ActionClass(...args);
  }

  static clear() {
    this.registry.clear();
  }
}
