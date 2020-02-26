import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import PlayerInputReader from  './playerinputreader.js';
import Input from './../core/input.js';
import Time from './../core/time.js';

import Rigidbody from './rigidbody.js';
import Vector2 from './../core/vector2.js';

const DeadZone = 0.333;
const JumpButtonIndex = 0;

/// 
/// 
/// 
export default class PlayerInputSystem extends BaseComponentSystem
{
	constructor()
	{
		super(PlayerInputReader);
	}
	
	Process(ent, input)
	{
		let axis = Input.GetAxis(0);
		
		if(Input.GetKeyDown("KeyD") || axis > DeadZone)
			input.Move = 1;
		if(Input.GetKeyDown("KeyA") || axis < - DeadZone)
			input.Move = -1;
		if(Input.GetKeyUp("KeyD"))
			input.Move = -Input.GetKey("KeyA");
		if(Input.GetKeyUp("KeyA"))
			input.Move = Input.GetKey("KeyD");
		//safety, incase they let go of both at the same time
		if(!Input.GetKey("KeyA") && ! Input.GetKey("KeyD") && Math.abs(axis) < DeadZone)
			input.Move = 0;
		
		input.Jump = Input.GetKeyDown("Space") || Input.GetButtonDown(JumpButtonIndex);
		input.JumpRelease = Input.GetKeyUp("Space") || Input.GetButtonUp(JumpButtonIndex);
		input.JumpHeld = Input.GetKey("Space") || Input.GetButton(JumpButtonIndex);
	}
}
