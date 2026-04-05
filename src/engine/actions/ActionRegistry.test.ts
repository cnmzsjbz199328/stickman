import { ActionRegistry } from './ActionRegistry';
import { Action } from '../base/Action';
import { Actor } from '../base/Entity';
import { World } from '../World';

class DummyAction extends Action {
  constructor(startTime: number, duration: number) {
    super('dummy', startTime, duration);
  }
  onUpdate(actor: Actor, world: World, progress: number, dt: number, time: number): void {
    // dummy implementation
  }
}

function runTests() {
  console.log('--- Running ActionRegistry Tests ---');
  
  ActionRegistry.clear();
  ActionRegistry.register('dummy', DummyAction as any);
  
  const created = ActionRegistry.create('dummy', 0, 1000);
  if (created && created.type === 'dummy') {
    console.log('✅ register() and create() successful.');
  } else {
    console.error('❌ Failed to create Action from registry.');
    process.exit(1);
  }

  const notFound = ActionRegistry.create('invalid', 0, 1000);
  if (notFound === null) {
    console.log('✅ Unregistered action correctly returns null.');
  } else {
    console.error('❌ Unregistered action did not return null.');
    process.exit(1);
  }
  
  console.log('--- All tests passed! ---');
}

runTests();
