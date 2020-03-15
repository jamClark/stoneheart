
///
/// Base class from which all component-systems must derive.
///
export default class BaseComponentSystem
{
	#RequiredComponents;
	#RequiredComponentNames;
	
	constructor(... requiredComponents)
	{
		this.#RequiredComponents = Array.from(requiredComponents);
		this.#RequiredComponentNames = this.#RequiredComponents.map(req => req.name.toString());
	}
	
	BatchProcess(entities)
	{
		for(let i = 0; i < entities.length; i++)
		{
			if(!entities[i].ActiveInHierarchy)
				continue;
			let matches = entities[i].QueryForComponentsByNamedArray(this.#RequiredComponentNames);
			if(matches != null && matches.length == this.#RequiredComponents.length)
			{
				let enabled = true;
				for(let comp of matches)
				{
					if(!comp.enabled)
					{
						enabled = false;
						continue;
					}
				}
				if(enabled)
					this.Process(entities[i], ...matches); //spread the matches array back out to individual parameters
			}
		}
		
		this.PostProcess();
	}
	
	FixedBatchProcess(entities)
	{
		for(let i = 0; i < entities.length; i++)
		{
			if(!entities[i].ActiveInHierarchy)
				continue;
			let matches = entities[i].QueryForComponentsByNamedArray(this.#RequiredComponentNames);
			if(matches != null && matches.length == this.#RequiredComponents.length)
			{
				let enabled = true;
				for(let comp of matches)
				{
					if(!comp.enabled)
					{
						enabled = false;
						continue;
					}
				}
				
				if(enabled)
					this.FixedProcess(entities[i], ...matches); //spread the matches array back out to individual parameters
			}
		}
		
		this.PostFixedProcess();
		
	}
	
	///
	/// Defined for reference. Must be overridden in base classes.
	///
	Process(entity)
	{
		console.log("This should never be printed! You have not overriden the Process method of your component system.");
	}
	
	///
	/// Defined for reference. Must be overridden in base classes.
	///
	FixedProcess(entity)
	{
		console.log("This should never be printed! You have not overriden the FixedProcess method of your component system.");
	}
	
	/// 
	/// Base implementation is empty. Override as needed.
	/// 
	PostProcess()
	{
	}
	
	/// 
	/// Base implementation is empty. Override as needed.
	/// 
	PostFixedProcess()
	{
	}
	
}

