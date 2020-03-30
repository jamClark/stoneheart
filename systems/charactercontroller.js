import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Time from './../core/time.js';
import Rigidbody from './rigidbody.js';
import Vector2 from './../core/vector2.js';

TypedObject.RegisterType("CharacterController", "BaseComponent");

/// 
/// 
/// 
export default class CharacterController extends BaseComponent
{
	constructor(jumpSound, landSound, leftSprite, rightSprite, leftAnim, rightAnim)
	{
		super();
		
		this.JumpSound = jumpSound;
		this.LandSound = landSound;
		
		this.LeftSprite = leftSprite;
		this.RightSprite = rightSprite;
		this.LeftAnim = leftAnim;
		this.RightAnim = rightAnim;
		
		//config
		this.MoveSpeed = 130;
		this.MoveAccel = 1500;
		this.MoveDecay = 1300;
		this.JumpForce = 6;
		this.JumpReleaseFactor = 0.5;
		this.StopThreshold = 0.1;
		
		//state
		this._CurrSpeed = 0;
		//BaseComponent._RegisterComponentType(this, CharacterController);
		//BaseComponent._DefineInspector(this, CharacterController);
	}
}