import TypedObject from './../../core/type.js';
import BaseComponent from './../../ecs/basecomponent.js';
import EntityMessage from './../../ecs/entitymessage.js';
import {EntityDied, EntityRevived} from './health.js';

TypedObject.RegisterFactoryMethod("HitStun", () => { return new HitStun(); });
TypedObject.RegisterType("HitStun", "BaseComponent");

const StunTime = 0.2;
const InvincibleTime = 2;

/// 
/// 
/// 
export default class HitStun extends BaseComponent
{
	#Stunned = false;
	#CallbackId = null;
	
	constructor()
	{
		super();
	}
	
	OnEnable()
	{
		this.Entity.AddListenerByName("TookDamage", this);
	}
	
	OnDisable()
	{
		if(this.#CallbackId)
			clearTimeout(this.#CallbackId);
		Restore();
		this.Entity.RemoveListenerByName("TookDamage", this);
	}
	
	HandleMessage(sender, msg)
	{
		if(this.#Stunned) return;
		this.Entity.GetComponent("CharacterController").enabled = false;
		this.Entity.GetComponent("Rigidbody").enabled = false;
		this.Entity.GetComponent("SpriteAnimator").CurrentAnim = "Hit";
		this.Entity.GetComponent("Health").OverlapInvincibility(InvincibleTime);
		
		this.#Stunned = true;
		this.#CallbackId = setTimeout(this.Restore.bind(this), StunTime * 1000);
	}
	
	Restore()
	{
		if(!this.#Stunned) return;
		this.#CallbackId = null;
		this.#Stunned = false;
		if(!this.Entity.GetComponent("Health").IsDead)
		{
			this.Entity.GetComponent("SpriteAnimator").CurrentAnim = "Idle";
			this.Entity.GetComponent("CharacterController").enabled = true;
		}
		
		this.Entity.GetComponent("Rigidbody").enabled = true;
	}
}

export class PlayerDied extends EntityMessage {}





