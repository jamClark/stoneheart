import AppState from './appstate.js';

/// 
/// State machine for managing list of functions that should be invoked
/// by the app loop each update frame or fixed update frame. Each node
/// of the stack represents a single state and only that state's callbacks
/// will be invoked whenit is at the top of the stack.
/// 
export default class AppStateMachine
{
	static EmptyLoopState = new AppState([], []);
	
	constructor()
	{
		this.States = [];
	}
	
	PushState(appState)
	{
		//deactivate previous gamestate, if any
		let len = this.States.length;
		if(len > 0)
			this.States[len-1].OnPopped();
		
		//add and activate new gamestate
		this.States.push(appState);
		appState.OnPushed();
	}

	PopState()
	{
		//deactivate and remove current gamestate
		let lastState = this.States.pop();
		if(lastState != null)
			lastState.OnPopped();
		
		//re-activate previous gamestate, if any
		let len = this.States.length;
		if(len > 0)
			this.States[len-1].OnPushed();
		
	}
}

