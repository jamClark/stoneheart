
/// 
/// Singleton that handles pooled object spawning.
/// 
/// All objects created this way are given a property named _LazarusPool that helps identify where
/// they should return when relenquished back to the system.
///
/// All objects will have the following functions called on them at the given times if the named fuctions exist:
/// 	-OnSpawnedFromPool(poolObj) 	-> When summoned from a pool.
///		-OnRelenquishedToPool(poolObj)	-> When returned to a pool
///		-OnRemovedFromPool(poolObj)		-> Called when Drain() or Relenquish() causes the object to be removed from the pool due to the pool already having max capacity.
///		
/// 
/// TODO: Promisify the chunksize pre-allocations done in Pool.Request().
///
/// TODO: A different mode where max capacity is the max allowed active spawns
///			and new summons simply recycle from the active list. This will require
///			invoking OnRelenquishedToPool() and OnSpawnedFromPool() in order to properly 
///			process recycled objects.
///
/// 
export default class Lazarus
{
	static #Pools = new Map();
	
	/// 
	/// Completely resets the internal state of this pooling system without
	/// regard for what has been allocated or summoned.
	/// 
	static Reset()
	{
		Lazarus.#Pools = new Map();
	}
	
	/// 
	/// Creats a pool that uses a specific factory and parameters to generate objects.
	/// The pool is then associated with the given id.
	/// 
	static Define(id, chunkSize, maxSize, factory, ...factoryParams)
	{
		let pool = Lazarus.#Pools.get(id);
		if(pool == null)
		{
			pool = new ObjPool(chunkSize, maxSize, factory, factoryParams);
			Lazarus.#Pools.set(id, pool);
		}
		else throw new Error("Pool with id '" + id.toString() + "' is already defined.");
		
		return pool;
	}
	
	/// 
	/// Returns true if a pool is already defined for the given id.
	/// 
	static IsDefined(id)
	{
		return Lazarus.#Pools.get(id) != null;
	}
	
	/// 
	/// Summons a pooled object from the given pool. If the pool does not exist and error will be thrown.
	/// 
	static Summon(id)
	{
		let pool = Lazarus.#Pools.get(id);
		if(pool == null)
			throw new Error("Pool '"+ id.toString() + "' does not exist.");
		return pool.Request();
	}
	
	/// 
	/// Returns the given entity to its appropriate pool if it came from one.
	/// Returns a reference to the pool to which this object was relenquished.
	/// 
	static Relenquish(obj)
	{
		if(typeof obj._LazarusPool == null)
		{
			console.log("The entity to relenquish did not come from a pool.");
			return;
		}
		
		let pool = obj._LazarusPool;
		pool.Relenquish(obj);
		return pool;
	}
	
	/// 
	/// Removes all pre-allocated objects from a given pool. This does not affect currently
	/// active object that came from that pool.
	/// 
	static Drain(id)
	{
		let pool = Lazarus.#Pools.get(id);
		if(pool != null)
			pool.Drain();
	}
	
	/// 
	/// Removes all pre-allocated objects from all pools. This does not affect currently
	/// active objects that came from any of these pools.
	/// 
	static DrainAll()
	{
		for(let pool of this.#Pools)
			pool.Drain();
	}
	
	/// 
	/// Relenquishes all active objects that came from the given pool.
	/// 
	static ReclaimActive(poolId)
	{
		let pool = Lazarus.#Pools.get(poolId);
		if(pool != null)
			pool.ReclaimActive();
	}
	
	/// 
	/// Relenquishes all active objects that came from all pools.
	/// 
	static ReclaimAllActive()
	{
		throw new Error("Not yet implemented");
	}
}


/// 
/// Helper class used by the Lazarus singleton to manage individual pools. Each ObjPool
/// handles objects that are created in identical fashion and treated as clones of one another.
/// 
class ObjPool
{
	//NOTE: Max Size isn't the max items allowed by this pool. That is infinite.
	//Instead it is how many can be stored in the pending list. If we exceed
	//that ammount when relenquishing, excess objects are no longer referenced.
	#MaxSize;
	#ChunkSize;
	
	#FactoryParams = [];
	#Factory;
	#Active = [];
	#Pending = [];
	
	
	constructor(chunkSize, maxSize, factoryMethod, ...factoryParams)
	{
		if(typeof factoryMethod != 'function')
			throw new Error("EntityPool factory must be a function.");
		
		this.#Factory = factoryMethod;
		this.#FactoryParams = Array.from(...factoryParams);
		
		this.#ChunkSize = Math.max(chunkSize, 1);
		this.#MaxSize = Math.max(this.#ChunkSize, maxSize);
	}
	
	get PendingCount() { return this.#Pending.length; }
	get ActiveCount() { return this.#Active.length; }
	get TotalCount() { return this.#Pending.length + this.#Active.length; }
	
	/// 
	/// Removes all pooled objects. This will not affect active objects in the scene.
	/// 
	Drain()
	{
		this.#Pending = [];
	}
	
	/// 
	/// Relenquishes all active object spawned from this pool.
	/// 
	ReclaimActive()
	{
		let list = this.#Active.slice();
		for(let item of list)
			this.Relenquish(item);
	}
	
	/// 
	/// Returns an object from the pool or, if the pool is empty, pre-allocates a
	/// chunk-sized number of elements and return sone of them.
	///
	/// NOTE: This method returns the type of object generated by the factory method,
	///       so if that factory returns a promise then so will this method.
	/// 
	Request()
	{
		if(this.#Pending.length > 0)
		{
			let obj = this.#Pending.pop();
			this.#Active.push(obj);
			if(typeof obj.OnSummonedFromPool === 'function')
				obj.OnSummonedFromPool(this);
			return obj;
		}
		else
		{
			let outterThis = this;
			
			//allocate 'chunk size' number of elements here
			//TODO: promisify this so that we don't block here!
			for(let i = 0; i < this.#ChunkSize; i++)
			{
				let thing = this.#Factory(...this.#FactoryParams);
				if(thing instanceof Promise)
				{
					thing.then(
						(result) =>
						{
							resolved._LazarusPool = outterThis;
							outterThis.#Pending.push(result);
						},
						(error) =>
						{
							throw new Error("Could not pre-allocated pool object from factory. " + error);
						}
					);
					//BUG ALERT: I have no clue what this is supposed to accomplish or why I put it here!
					if(i == this.#ChunkSize-1)
					{
						//this is not incrementing the active count, nor is it invoking 
						//the OnSummonedFromPool() function on the object summoned.
						throw new Error("I have no idea why I put this section of code here!");
						return thing;
					}
				}
				else
				{
					thing._LazarusPool = this;
					this.#Pending.push(thing);
					if(i == this.#ChunkSize-1)
						return this.Request();
				}
			}
			
		}
	}
	
	/// 
	/// Returns this item to the inactive pool.
	/// 
	Relenquish(obj)
	{
		let indexOf = this.#Active.indexOf(obj);
		if(indexOf > -1)
		{
			if(typeof obj.OnRelenquishedToPool === 'function')
				obj.OnRelenquishedToPool(this);
			
			this.#Active.splice(indexOf, 1);
			if(this.#Pending.length < this.#MaxSize)
				this.#Pending.push(obj);
		}
		else throw new Error("Attempting to relenquish an object that does not belong to a pool.");
		
	}
}
