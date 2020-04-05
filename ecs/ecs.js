
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
}