import BaseComponent from './../ecs/basecomponent.js';


/// 
/// 
/// 
export default class PlayerInputReader extends BaseComponent
{
	constructor()
	{
		super();
		this.Jump = false; 			//jump impulse
		this.JumpRelease = false; 	//latch for jumping
		this.Move = 0; 				//left-right movement
	}
}

