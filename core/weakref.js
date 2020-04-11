

export default WeakRef
{
	#Ref = null;
	
	
	constructor(value)
	{
		this.#Ref = value;
	}
	
	get Ref() { return this.#Ref; }
	set Ref() { return this.#Ref; }
	
	OnRefLost()
	{
		this.#Ref = null;
	}
}

export class WeakRefFactory
{
	static #RefMap = new Map();
	
	static CreateWeakRef(obj)
	{
		let ref = this.#RefMap.get(obj);
		if(ref) return ref;
		
		this.#RefMap.set(obj, new WeakRef(obj));
	}
	
	static RevokeRef(obj)
	{
		
	}
}