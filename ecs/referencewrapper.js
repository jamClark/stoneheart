/// 
/// Used to wrap a reference to another ECS object in the scene. Due to the lack
/// of weak references in javascript, this mechanism is needed to ensure we don't
/// attempt to access references to objects that have been destroyed in the ECS.
///
/// This object will not release references when an object is destroyed so it does
/// not function in the capacity of a proper weak reference.
///
/// Instead, the next time access is attempted it will check for the IsDestroyed flag
/// and nullify the internal reference if it is set.
/// 
export default class ReferenceWrapper
{
	#Ref;
	
	constructor(value)
	{
		this.#Ref = value;
	}
	
	get Ref()
	{
		if(!this.#Ref) return null;
		else if(this.#Ref.IsDestroyed)
			this.#Ref = null;
		
		return this.#Ref;
	}
	
	set Ref(value) { this.#Ref = (!value || value.IsDestroyed) ? null : value; }
}
