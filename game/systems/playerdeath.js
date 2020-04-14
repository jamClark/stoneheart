import TypedObject from './../../core/type.js';
import BaseComponent from './../../ecs/basecomponent.js';
import EntityMessage from './../../ecs/entitymessage.js';
import {EntityDied, EntityRevived} from './health.js';

TypedObject.RegisterFactoryMethod("PlayerDeath", () => { return new PlayerDeath(); });
TypedObject.RegisterType("PlayerDeath", "BaseComponent");

/// 
/// 
/// 
export default class PlayerDeath extends BaseComponent
{
	constructor()
	{
		super();
	}
	
	OnEnable()
	{
		this.Entity.AddListener(EntityDied, this);
	}
	
	OnDisable()
	{
		this.Entity.RemoveListener(EntityDied, this);
	}
	
	HandleMessage(sender, msg)
	{
		this.Entity.GetComponent("CharacterController").enabled = false;
		this.Entity.GetComponent("PlayerSpawnPoster").enabled = false;
		
		let anim = this.Entity.GetComponent("SpriteAnimator");
		if(anim != null)
		{
			anim.CurrentAnim = "Death";
			anim.Loop = false;
		}
		
		this.Entity.PostMessage(new PlayerDied());
	}
}

export class PlayerDied extends EntityMessage {}





