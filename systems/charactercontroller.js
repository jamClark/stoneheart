import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Time from './../core/time.js';
import Rigidbody from './rigidbody.js';
import Vector2 from './../core/vector2.js';
import SpriteAnimator from './spriteanimator.js';
import PlayerInputReader from './playerinputreader.js';


TypedObject.RegisterFactoryMethod("CharacterController", () => { return new CharacterController(); });
TypedObject.RegisterType("CharacterController", "BaseComponent", () =>
{
	let type = TypedObject.GetType("CharacterController");
	type.AddSerializedProp(	'MoveSpeed', 'MoveAccel', 'MoveDecay', 'JumpForce', 'JumpReleaseFactor','StopThreshold',
							'JumpSound','LandSound','LeftSprite', 'RightSprite', 'LeftAnim', 'RightAnim');
	type.AddInspectorProp(['float','Move Speed'], ['float','Move Accel'], ['float', 'Move Decay'], 
		['float','Jump Force'],['float','Jump Release'], ['float','Stop Threshold'],
		["Assets.Sounds","Jump Sfx"], ["Assets.Sounds","Land Sfx"], 
		["Assets.Sprites","Left Sprite"], ["Assets.Sprites","Right Sprite"], 
		["Assets.Anims","Left Anim"], ["Assets.Anims","Right Anim"]);
});

//function GenerateAssetSetter(propName


/// 
/// 
/// 
export default class CharacterController extends BaseComponent
{
	#JumpSound = null;
	#LandSound = null;
	#LeftSprite = null;
	#RightSprite = null;
	#LeftAnim = null;
	#RightAnim = null;
	
	constructor()
	{
		super();
		this.RequireComponent(SpriteAnimator);
		this.RequireComponent(PlayerInputReader);
		
		//config
		this.MoveSpeed = 130;
		this.MoveAccel = 1500;
		this.MoveDecay = 1300;
		this.JumpForce = 6;
		this.JumpReleaseFactor = 0.5;
		this.StopThreshold = 0.1;
		
		//state
		this._CurrSpeed = 0;
	}
		
	get JumpSound() { return this.#JumpSound; }
	set JumpSound(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#JumpSound = result);
		else this.#JumpSound = asset;
	}
	
	get LandSound() { return this.#LandSound; }
	set LandSound(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#LandSound = result);
		else this.#LandSound = asset;
	}
	
	get LeftSprite() { return this.#LeftSprite; }
	set LeftSprite(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#LeftSprite = result);
		else this.#LeftSprite = asset;
	}
	
	get RightSprite() { return this.#RightSprite; }
	set RightSprite(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#RightSprite = result);
		else this.#RightSprite = asset;
	}
	
	get LeftAnim() { return this.#LeftAnim; }
	set LeftAnim(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#LeftAnim = result);
		else this.#LeftAnim = asset;
	}
	
	get RightAnim() { return this.#RightAnim; }
	set RightAnim(asset)
	{
		if(asset instanceof Promise)
			asset.then(result => this.#RightAnim = result);
		else this.#RightAnim = asset;
	}
}

