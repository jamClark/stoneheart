import {TestECS} from './ecs/tests/ecstests.js'
import {TestAppState} from './core/tests/appstatetests.js';
import {TestInput} from './core/tests/inputtests.js';
import {TestAssetManager} from './core/tests/assetmanagertests.js';
import {TestVector2} from './core/tests/vector2tests.js';
import {TestRect} from './core/tests/recttests.js';
import {TestPool} from './game/tests/pooltests.js';
import {TestMessageDispatch} from './core/tests/messagedispatchtests.js';


export async function TestStart(canvas)
{
	TestECS(canvas);
	TestAppState(canvas);
	TestInput(canvas);
	await TestAssetManager(canvas);
	TestVector2(canvas);
	TestRect(canvas);
	await TestPool(canvas);
	TestMessageDispatch(canvas);
}

