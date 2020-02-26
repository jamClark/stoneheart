import Entity from './entity.js';

/// 
/// 
/// 
export default class EntityManager
{
	#Listeners = new Map();
	
	
	constructor()
	{
		this._entities = [];
	}
	
	get Entities() { return [...this._entities]; }
	
	RegisterEntity(entity)
	{
		if(!(entity instanceof Entity))
			throw new Error("Attemping to register a non-Entity object with an EntityManager.");
		
		this._entities.push(entity);
		entity._Manager = this;
	}
	
	UnregisterEntity(entity)
	{
		if(!(entity instanceof Entity))
			throw new Error("Attemping to unregister a non-Entity object with an EntityManager.");
		
		let index = this._entities.indexOf(entity);
		if(index > -1)
			this._entities.splice(index, 1);
		entity._Manager = null;
	}
	
	QueryForEntity(... desiredTypes)
	{
		//TODO: go through all registered entities and get all that have the given components
		throw new Error("Not yet implemented");
	}
	
	
	/// 
	/// Registers an entity as being a global listener for a given message type.
	/// 
	AddListener(messageType, entity)
	{
		let ents = this.#Listeners.get(messageType.name.toString());
		if(ents == null)
			ents = [];
		ents.push(entity);
		this.#Listeners.set(messageType.name.toString(), ents);
	}
	
	/// 
	/// Removes an entity as being a global listener for a given message type.
	/// 
	RemoveListener(messageType, entity)
	{
		let ents = this.#Listeners.get(messageType.name.toString());
		if(ents == null) return;
		let index = ents.indexOf(entity);
		if(index >= 0) ents.splice(index, 1);
		if(ents.length < 1) 
			this.#Listeners.delete(messageType.name.toString());
	}
	
	/// 
	/// Sends a message to all registered entities so that they
	/// can dispatch to their own registered listeners.
	/// 
	PostMessage(sender, msg)
	{
		let ents = this.#Listeners.get(msg.type);
		if(ents == null) return;
		
		for(let e of ents)
			e.ReceiveGlobalMessage(sender, msg);
	}
}
