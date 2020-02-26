import {ColorLog, describe, it, expect} from './../testutility.js';
import AppState from './../appstate.js';
import AppStateMachine from './../appstatemachine.js';

import {
	AddUpdateCallback,
	RemoveUpdateCallback,
	StepFrame } from './../apploop.js';


export function TestAppState()
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing AppStateMachine ----------------", "info");
		testLoop();
		testPushState();
		resolve();
	});
}

function testLoop()
{
	describe("Tests addition, invocation, and removal of a single method from app loop", () =>
	{
		let x = 0;
		let f = () => x++;
		AddUpdateCallback(f);
		StepFrame();
		it("Value has been modified through the use of an update callback", () => expect(x).toBe(1));
		
		RemoveUpdateCallback(f);
		StepFrame();
		it("Value has not been modified after removing update callback", () => expect(x).toBe(1));
		
	});
}

function testPushState()
{
	describe("Confirms that a state updates work properly", () =>
	{
		let x = 0;
		let fsm = new AppStateMachine();
		let state1 = new AppState([() => x++]);
		let state2 = new AppState([]);
		
		StepFrame();
		it("Update value has NOT been modified before pushing state", () => expect(x).toBe(0));
		
		fsm.PushState(state1);
		StepFrame();
		it("Update value has been modified after pushing state", () => expect(x).toBe(1));
		
		fsm.PopState();
		StepFrame();
		it("Update value has NOT been modified after popping state", () => expect(x).toBe(1));
		
		fsm.PushState(state1);
		StepFrame();
		it("Update value has been modified after pushing state", () => expect(x).toBe(2));
		
		fsm.PushState(state2);
		StepFrame();
		it("Update value has NOT been modified after pushing another state state", () => expect(x).toBe(2));
		
		
		fsm.PopState();
		StepFrame();
		it("Update value has been modified after popping another state state", () => expect(x).toBe(3));
	});
}



