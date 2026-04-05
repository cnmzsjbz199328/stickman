export type EntityType = 'actor' | 'platform' | 'weapon';

export class Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  prevY: number = 0;
  width: number;
  height: number;
  vx: number = 0;
  vy: number = 0;
  solid: boolean = true;
  trigger: boolean = false;

  constructor(id: string, type: EntityType, x: number, y: number, width: number, height: number) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Actor extends Entity {
  direction: number = 1;
  color: string;
  
  // Timeline System
  actions: any[] = [];
  t: number = 0; // internal time for walk cycle

  constructor(id: string, x: number, y: number, color: string) {
    super(id, 'actor', x, y, 40, 80);
    this.color = color;
  }
}

export class Platform extends Entity {
  color: string;
  constructor(id: string, x: number, y: number, width: number, height: number, color: string = '#6b7280') {
    super(id, 'platform', x, y, width, height);
    this.color = color;
    this.solid = false; // Handled by one-way logic, not AABB push
  }
}

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
