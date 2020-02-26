import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Input from './../core/input.js';
import Time from './../core/time.js';
import Vector2 from './../core/vector2.js';

import CharacterController from './charactercontroller.js';
import PlayerInputReader from  './playerinputreader.js';
import Rigidbody from './rigidbody.js';
import SpriteAnimator from './spriteanimator.js';
import SpriteRenderer from './spriterenderer.js';

const GroundedJumpFudge = 0.1;
const MotionThreshold = 0.1;
const PreJumpFudge = 0.05;

const JUMP_VOLUME = 0.3;
const LAND_VOLUME = 0.3;

/// 
/// 
/// 
export default class CharacterControllerSystem extends BaseComponentSystem
{
	#JumpPressTime = -10000;
	#LastGroundedTime = -1000;
	#AssetManager;
	
	constructor(assetManager)
	{
		super(CharacterController, Rigidbody, PlayerInputReader, SpriteRenderer, SpriteAnimator);
		this.#AssetManager = assetManager;
		this.LastDir;
	}
	
	/// 
	/// Reader, RB, CC, Rend, animator
	/// 
	DetermineAnim(ent, controller, body, input, rend, animator)
	{
		if(input.Move > MotionThreshold)
		{
			rend.Sprite = controller.RightSprite;
			animator.AnimAsset = controller.RightAnim;
			if(body.IsGrounded)
				animator.PlayAnim("Run");
		}
		else if(input.Move < -MotionThreshold)
		{
			rend.Sprite = controller.LeftSprite;
			animator.AnimAsset = controller.LeftAnim;
			if(body.IsGrounded)
				animator.PlayAnim("Run");
		}
		else
		{
			if(body.IsGrounded)
				animator.PlayAnim("Idle");
		}
		if(!body.IsGrounded)
		{
			if(body.Velocity.y > 0) animator.PlayAnim("Jump");
			else animator.PlayAnim("Fall");
		}
	}
	
	get JumpPressed() { return Time.time - this.#JumpPressTime < PreJumpFudge; }
	get IsGrounded() { return Time.time - this.#LastGroundedTime < GroundedJumpFudge; }
	
	/// 
	/// 
	/// 
	Process(ent, controller, body, input, rend, animator)
	{
		if(body.IsGrounded)
		{
			if(!this.WasGrounded && Time.time - this.#LastGroundedTime > 0.25) //stop sound from playing to frequently
				controller.LandSound.replay(LAND_VOLUME);
			
			this.#LastGroundedTime = Time.time;
		}
		this.WasGrounded = body.IsGrounded;
		if(input.Jump)
			this.#JumpPressTime = Time.time;
		if(!input.JumpHeld && body.Velocity.y > 0)
			body.Velocity.y = body.Velocity.y * controller.JumpReleaseFactor;
		if(this.JumpPressed && this.IsGrounded && body.Velocity.y < MotionThreshold)
		{
			body.AddImpulse(new Vector2(0, controller.JumpForce));
			controller.JumpSound.replay(JUMP_VOLUME);
		}
		
		//show appropriate anims
		this.DetermineAnim(ent, controller, body, input, rend, animator);
	}
	
	/// 
	/// 
	/// 
	FixedProcess(ent, controller, body, input, rend, animator)
	{
		let vel = Vector2.Zero;
		if(input.Move * input.Move > 0)
		{
			controller._CurrSpeed += controller.MoveAccel * Time.fixedDeltaTime * input.Move;
			if(controller._CurrSpeed > controller.MoveSpeed) controller._CurrSpeed = controller.MoveSpeed;
			else if(controller._CurrSpeed < -controller.MoveSpeed) controller._CurrSpeed = -controller.MoveSpeed;
		}
		else
		{
			if(controller._CurrSpeed > controller.StopThreshold)
			{
				controller._CurrSpeed -= controller.MoveDecay * Time.fixedDeltaTime;
				if(controller._CurrSpeed < 0) controller._CurrSpeed = 0;
			}
			else if(controller._CurrSpeed < -controller.StopThreshold)
			{
				controller._CurrSpeed += controller.MoveDecay * Time.fixedDeltaTime;
				if(controller._CurrSpeed > 0) controller._CurrSpeed = 0;
			}
			else controller._CurrSpeed = 0;
		}
		vel = new Vector2(controller._CurrSpeed*Time.fixedDeltaTime, 0);
		body.Move(vel);
	}
}