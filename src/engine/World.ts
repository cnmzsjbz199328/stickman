import { Entity, Actor, Platform } from './base/Entity';

export { Entity, Actor, Platform };
export type { EntityType } from './base/Entity';

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  ownerId: string;
  direction: number;
  force: number;
}

export class World {
  entities: Map<string, Entity> = new Map();
  hitboxes: Hitbox[] = [];
  gravity: number = 2000; // px/s^2
  groundY: number = 160;

  add(entity: Entity) {
    this.entities.set(entity.id, entity);
  }

  get(id: string) {
    return this.entities.get(id);
  }

  getActors(): Actor[] {
    return Array.from(this.entities.values()).filter(e => e.type === 'actor') as Actor[];
  }

  getPlatforms(): Platform[] {
    return Array.from(this.entities.values()).filter(e => e.type === 'platform') as Platform[];
  }
}
