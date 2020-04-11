import BaseComponentSystem from './basecomponentsystem.js';

/// 
/// 
/// 
export default class SystemsManager
{
	#Systems = [];
	#FixedSystems = [];
	#EntityManager;
	
	
	constructor(entityManager)
	{
		this.enabled = true;
		this.#EntityManager = entityManager;
	}
	
	RegisterSystem(system)
	{
		if(!(system instanceof BaseComponentSystem))
			throw new Error("Attempting to register a non-component system with the system manager's updates.");
		this.#Systems.push(system);
	}
	
	RegisterFixedSystem(system)
	{
		if(!(system instanceof BaseComponentSystem))
			throw new Error("Attempting to register a non-component system with the system manager's fixed updates.");
		this.#FixedSystems.push(system);
	}
	
	///
	/// Call this each frame to make each registered ComponentSystem run.
	///
	Update()
	{
		if(!this.enabled) return;
		
		for(let i = 0; i < this.#Systems.length; i++)
			this.#Systems[i].BatchProcess(this.#EntityManager._EntitiesDirect);
	}
	
	///
	/// Call this for each fixed update cycle to make each registered ComponentSystem run.
	///
	FixedUpdate()
	{
		if(!this.enabled) return;
		
		for(let i = 0; i < this.#FixedSystems.length; i++)
			this.#FixedSystems[i].FixedBatchProcess(this.#EntityManager._EntitiesDirect);
	}
}
