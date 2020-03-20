import {ColorLog} from './../core/utility.js';


///
/// Base class from which all components must derive.
///
export default class BaseComponent
{
	#Enabled = true;
	#Type;
	
	constructor()
	{
		this.type = this.constructor.name;
		this._Entity = null;
		this._RunOnce = true;
		BaseComponent._RegisterComponentType(this, ['enabled']);
	}
	
	get Entity() { return this._Entity; }
	get enabled() 
	{
		return this.#Enabled;
	}
	set enabled(value)
	{
		if(value && !this.#Enabled && this.Entity.ActiveInHierarchy)
			this.OnEnable();
		if(!value && this.#Enabled && this.Entity.ActiveInHierarchy)
			this.OnDisable();
		
		
		this.#Enabled = value;
	}
	
	OnAttached() {}
	OnDetached() {}
	OnDestroy() {}
	OnEnable() {}
	OnDisable() {}
	Awake() {}
	
	_InnerEnable()
	{
		if(this._RunOnce != null)
		{
			delete this._RunOnce;
			this.Awake();
		}
		this.OnEnable();
	}
	
	/// 
	/// Removes this component from its entity and destroys it.
	/// 
	Destroy()
	{
		if(this.Entity.RemoveComponent(this) != null)
			this.OnDestroy();
	}
	
	GetComponent(comp) { return this._Entity.GetComponent(comp); }
	HandleMessage(sender, msg) {}
	
	
	static #RegisteredTypes = new Map();
	
	/// 
	/// Internal use only. This is called internally as a way to 
	/// define properties that will be included for serialization.
	/// 
	static _RegisterComponentType(compInst, props)
	{
		if(!(compInst instanceof BaseComponent))
			throw new Error("Invalid argument. Object derived from BaseComponent is expected.");
		
		
		let comp = compInst.type;
		if(BaseComponent.#RegisteredTypes.has(comp))
			return;
		
		//walk up the inheritance chain, gathering all properties that are registered for serialization
		let proto = comp.prototype;
		while(proto != null)
		{
			let inheritedProps = BaseComponent.#RegisteredTypes.get(proto);
			if(inheritedProps != null)
				props.push(...inheritedProps);
			proto = proto.prototype;
		}
		
		BaseComponent.#RegisteredTypes.set(comp, props);
	}
	
	/// 
	/// Obtains the list of properties that have been previously registered
	/// for serialization for a given component type.
	/// 
	static GetComponentRegisteredProperties(compType)
	{
		let comp = compType.name;
		let list = BaseComponent.#RegisteredTypes.get(comp);
		if(list == null)
		{
			ColorLog("Warning! Component type " + comp + " has not been registered.", "warning");
			return null;
		}
		return [...list];
	}
}
