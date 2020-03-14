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
	
	/// 
	/// Iterates through all entities and removes any that have been marked for destruction.
	/// 
	RemoveDestroyedEntities()
	{
		let i = 0;
		for(let i = 0; i < this._entities.length;)
		{
			let ent = this._entities[i];
			
			if(ent.DestroyPending)
			{
				ent.PostDestruction();
				this._entities.splice(i, 1);
			}
			else i++;
		}
	}
	
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
	
	/// 
	/// Returns a list of all entities registered with this manager that have all of the given cmponents attached.
	/// 
	QueryForEntities(... desiredTypes)
	{
		let list = [];
		for(let ent of this._entities)
		{
			if(ent.HasComponents(...desiredTypes))
				list.push(ent);
		}
		
		return list;
	}
	
	/// 
	/// Filters a list of entities and only returns the ones that do not have any of the given components attached.
	/// 
	FilterEntities(entities, ...undesiredTypes)
	{
		let list = [];
		for(let ent of entities)
		{
			if(!ent.HasAnyComponents(...undesiredTypes))
				list.push(ent);
		}
		
		return list;
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
