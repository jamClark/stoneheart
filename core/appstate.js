import { AddUpdateCallback, RemoveUpdateCallback } from './apploop.js';

///
/// Interface that contains a list of delegates that should be processed each update tick
/// when this state is at the top of a AppStateMachine stack.
///
export default class AppState
{
	#UpdateFuncs = [];
	
	constructor(updateFuncs)
	{
		this.#UpdateFuncs = updateFuncs;
	}
	
	OnPushed()
	{
		for(let callback of this.#UpdateFuncs)
			AddUpdateCallback(callback);
	}
	
	OnPopped()
	{
		for(let callback of this.#UpdateFuncs)
			RemoveUpdateCallback(callback);
	}
}