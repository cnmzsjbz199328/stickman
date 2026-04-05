import { World, Actor, Platform } from './World';
import { ActionSystem } from './ActionSystem';

export class PhysicsSystem {
  static update(world: World, dt: number) {
    const dtSec = dt / 1000;
    const platforms = world.getPlatforms();
    const actors = world.getActors();

    // 1. Gravity & Movement
    for (const entity of world.entities.values()) {
      if (entity.type === 'actor') {
        entity.prevY = entity.y;
        entity.vy += world.gravity * dtSec;
        entity.y += entity.vy * dtSec;
        
        let onPlatform = false;
        
        // Platform Collision (One-way)
        for (const platform of platforms) {
          const left1 = entity.x - entity.width / 2;
          const right1 = entity.x + entity.width / 2;
          const left2 = platform.x - platform.width / 2;
          const right2 = platform.x + platform.width / 2;
          
          // Check horizontal overlap
          if (right1 > left2 && left1 < right2) {
            // Check vertical crossing (was above or on, now below)
            if (entity.prevY <= platform.y && entity.y >= platform.y) {
              // Only snap if falling
              if (entity.vy > 0) {
                entity.y = platform.y;
                entity.vy = 0;
                onPlatform = true;
              }
            }
          }
        }

        // Basic ground collision
        if (!onPlatform && entity.y > world.groundY) {
          entity.y = world.groundY;
          entity.vy = 0;
        }
      }
    }

    // 2. Solid Collision (AABB - Horizontal)
    for (let i = 0; i < actors.length; i++) {
      for (let j = i + 1; j < actors.length; j++) {
        const a = actors[i];
        const b = actors[j];
        if (!a.solid || !b.solid) continue;

        const dist = a.x - b.x;
        const minDistance = a.width / 2 + b.width / 2;
        
        if (Math.abs(dist) < minDistance) {
          const overlap = minDistance - Math.abs(dist);
          const dir = Math.sign(dist) || 1;
          
          // Push both apart equally
          a.x += (overlap / 2) * dir;
          b.x -= (overlap / 2) * dir;
        }
      }
    }

    // 3. Trigger Collisions (Hitboxes)
    for (const hitbox of world.hitboxes) {
      for (const actor of actors) {
        if (actor.id === hitbox.ownerId) continue;
        
        const dx = Math.abs(actor.x - hitbox.x);
        const actorCenterY = actor.y - actor.height / 2;
        const dy = Math.abs(actorCenterY - hitbox.y);
        
        if (dx < (actor.width / 2 + hitbox.width / 2) && 
            dy < (actor.height / 2 + hitbox.height / 2)) {
          ActionSystem.triggerHit(actor, hitbox.force * hitbox.direction, performance.now());
        }
      }
    }
    world.hitboxes = []; // Clear hitboxes after processing
  }
}
