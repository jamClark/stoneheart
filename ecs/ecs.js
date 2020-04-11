import {GenerateUUID} from './../core/utility.js';

/// 
/// A kind of global container for shared global data that will need to be accessed
/// by any part of the ECS. Fields int his class are read-only once set.
/// 
export default class ECS
{
	static #Fields = new Map();
	
	
	constructor()
	{
	}
	
	static Set(id, value)
	{
		if(ECS.#Fields.has(id))
			throw new Error("Global ECS value already defined for '" + id + "'.");
		ECS.#Fields.set(id, value);
	}
	
	static Get(id)
	{
		return ECS.#Fields.get(id);
	}
	
	/// 
	/// Creates a copy of the given ECS Entity.
	/// 
	static Instantiate(entityMan, blueprint)
	{
		if(!(blueprint instanceof Entity))
			throw new Error("Cannot instantiate non-Entity objects.");
		if(!blueprint)
			throw new Error("Invalid null argument passed to Instantiate.");
		
		
		let ent = new Entity(srcEnt.name);
		let trans = new WorldPosition();
		let selection = new SelectionBox();
		ent.AddComponent(trans);
		ent.AddComponent(selection);
		entityMan.RegisterEntity(ent);
		
		trans.position = srcEnt.GetComponent(WorldPosition).position;
		ent.Active = srcEnt.Active;
		
		for(let comp of srcEnt.Components)
		{
			if(comp.type != "WorldPosition" && comp.type != "SelectionBox")
			{
				let newComp = TypedObject.Activate(comp.type);
				ent.AddComponent(newComp);
				newComp.CopySettings(comp);
			}
		}
	}
}