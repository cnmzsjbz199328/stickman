import { ActionManager } from './ActionManager';
import { Actor } from '../base/Entity';
import { Action } from '../base/Action';
import { World } from '../World';

class DummyMoveAction extends Action {
  constructor(startTime: number) {
    super('move', startTime, 1000, 1); // priority 1
  }
  onUpdate() {}
}

class DummyHitAction extends Action {
  constructor(startTime: number) {
    super('hit', startTime, 400, 10); // priority 10
  }
  onUpdate() {}
}

function runTests() {
  console.log('--- Running ActionManager Tests ---');
  const actor = new Actor('A', 0, 0, '#000');
  
  const move1 = new DummyMoveAction(0);
  let resolved = false;
  move1.resolve = () => { resolved = true; };
  
  ActionManager.pushAction(actor, move1);
  if (actor.actions.length === 1 && actor.actions[0] === move1) {
    console.log('✅ pushAction() successfully added move action.');
  } else {
    console.error('❌ pushAction() failed to add move action.');
    process.exit(1);
  }

  const hit1 = new DummyHitAction(100);
  ActionManager.pushAction(actor, hit1);
  
  if (actor.actions.length === 1 && actor.actions[0] === hit1) {
    console.log('✅ pushAction() with high priority hit action cleared lower priority actions.');
  } else {
    console.error('❌ pushAction() failed to resolve conflicts via priority.');
    process.exit(1);
  }

  if (resolved) {
     console.log('✅ Interrupted actions are gracefully resolved.');
  } else {
     console.error('❌ Interrupted actions were not resolved.');
     process.exit(1);
  }
  
  console.log('--- All tests passed! ---');
}

runTests();
