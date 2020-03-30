import Entity from './entity.js';

/// 
/// 
/// 
export default class EntityManager
{
	#Listeners = new Map();
	
	#EntityRegisteredListeners = [];
	#EntityUnregisteredListeners = [];
	
	
	constructor()
	{
		this._entities = [];
	}
	
	get Entities() { return [...this._entities]; }
	
	AddEntityRegisteredListener(handler)
	{
		this.#EntityRegisteredListeners.push(handler);
	}
	
	RemoveEntityRegisteredListener(handler)
	{
		let index = this.#EntityRegisteredListeners.indexOf(handler);
		if(index >= 0)
			this.#EntityRegisteredListeners.splice(index, 1);
	}
	
	AddEntityUnregisteredListener(handler)
	{
		this.#EntityUnregisteredListeners.push(handler);
	}
	
	RemoveEntityUnregisteredListener(handler)
	{
		let index = this.#EntityUnregisteredListeners.indexOf(handler);
		if(index >= 0)
			this.#EntityUnregisteredListeners.splice(index, 1);
	}
	
	HouseKeeping()
	{
		this.RemoveDestroyedEntities();
		this.EnableScheduledEntities();
	}
	
	/// 
	/// Iterates through all entities and removes any that have been marked for destruction.
	/// 
	RemoveDestroyedEntities()
	{
		let i = 0;
		for(let i = 0; i < this._entities.length;)
		{
			let ent = this._entities[i];
			
			if(ent._DestroyPending)
			{
				ent.PostDestruction();
				if(!this.UnregisterEntity(ent))
					i++;
			}
			else i++;
		}
	}
	
	/// 
	/// Iterates through all entities and invokes _InnerEnable() on any that have been marked for it.
	/// Typically, entities that have had components added since the last update will have this flag set.
	/// 
	EnableScheduledEntities()
	{
		for(let ent of this._entities)
		{
			if(ent.ActiveInHierarchy && ent._ScheduleForEnabling)
				ent._InnerEnable();
		}
	}
	
	RegisterEntity(entity)
	{
		if(!(entity instanceof Entity))
			throw new Error("Attemping to register a non-Entity object with an EntityManager.");
		
		this._entities.push(entity);
		for(let callback of this.#EntityRegisteredListeners)
				callback(this, entity);
		entity._Manager = this;
	}
	
	UnregisterEntity(entity)
	{
		if(!(entity instanceof Entity))
			throw new Error("Attemping to unregister a non-Entity object with an EntityManager.");
		
		let result = false;
		let index = this._entities.indexOf(entity);
		if(index > -1)
		{
			result = true;
			this._entities.splice(index, 1);
			for(let callback of this.#EntityUnregisteredListeners)
				callback(this, entity);
		}
		entity._Manager = null;
		return result;
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
