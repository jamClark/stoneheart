import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import EntityMessage from './../ecs/entitymessage.js';

TypedObject.RegisterFactoryMethod("PlayerSpawnPoster", () => { return new PlayerSpawnPoster(); });
TypedObject.RegisterType("PlayerSpawnPoster", "BaseComponent");

/// 
/// 
/// 
export default class PlayerSpawnPoster extends BaseComponent
{
	constructor()
	{
		super();
	}
	
	OnEnable()
	{
		this.Entity.PostMessage(new PlayerSpawn());
	}
	
	OnDisable()
	{
		this.Entity.PostMessage(new PlayerDespawn())
	}
}

export class PlayerSpawn extends EntityMessage {}
export class PlayerDespawn extends EntityMessage {}
