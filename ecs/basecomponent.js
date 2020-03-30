import {ColorLog} from './../core/utility.js';
import TypedObject from './../core/type.js';

TypedObject.RegisterType("BaseComponent", "TypedObject", () =>
{
	let type = TypedObject.GetType("BaseComponent");
	type.AddSerializedProp('enabled');
	type.AddInspectorProp(['bool','Enabled']);
});

///
/// Base class from which all components must derive.
///
export default class BaseComponent extends TypedObject
{
	#Enabled = true;
	
	constructor()
	{
		super();
		this._Entity = null;
		this._RunOnce = true;
	}
	
	
	
	static get AllowMultipleAttrName() { return 'AllowMultiple'; }
	
	get type() { return this.TypeName; }
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
	
	
	get RegisteredSerializationProperties()
	{
		return BaseComponent.GetRegisteredSerializationProperties(this.type);
	}
	
	get RegisteredInspectorProperties()
	{
		return BaseComponent.GetRegisteredInspectorProperties(this.type);
	}
	
	GetInspectorOverrideForProperty(propName)
	{
		return BaseComponent.GetInspectorOverrideForProperty(this.type, propName);
	}
	
	
	static #RegisteredTypes = new Map();
	static #RegisteredInspectors = new Map();
	static #BlacklistedObjects = [];
	static #BlacklistedProperties = new Map();
	static #InspectorOverrides = new Map();
	static #Attributes = new Map();
	
	static _DefineAttribute(compType, attributeName, value)
	{
		let comp = compType.name;
		let list = BaseComponent.#Attributes.get(comp);
		if(list == null)
			list = [];
		
		let index = list.map(x => x[0]).indexOf(attributeName);
		if(index >= 0)
			list[index] = [attributeName, value];
		else list.push([attributeName, value]);
	}
	
	static GetAttributes(compName)
	{
		let list = BaseComponent.#Attributes.get(compName);
		if(list == null) return [];
		else return list;
	}
	
	static HasAttribute(compName, attrName)
	{
		let attrs = BaseComponent.GetAttribute(compName);
		return attrs.map(x => x[0]).indexOf(attrName) >= 0;
	}
	
	static GetAttributeValue(compName, attrName)
	{
		let attrs = BaseComponent.GetAttribute(compName);
		let index = attrs.map(x => x[0]).indexOf(compName);
		if(index >= 0)
			return attrs[index][1];
		else throw new Error("Attribute '"+attrName+"' not defined on the component type '"+compName+"'.");
	}
	
	/// 
	/// Internal use only. This is called internally as a way to 
	/// define properties that will be included for serialization.
	/// 
	static _RegisterComponentType(instance, compType, props)
	{
		if(!(instance instanceof BaseComponent))
			throw new Error("Invalid argument. Object derived from BaseComponent is expected.");
		
		let comp = compType.name;
		if(BaseComponent.#RegisteredTypes.has(comp))
			return;
		
		let result = [];
		if(props != null)
			result.push(...props);
		//walk up the inheritance chain, gathering all properties that are registered for serialization
		let proto = Object.getPrototypeOf(instance);
		while(proto != null)
		{
			let inheritedProps = BaseComponent.#RegisteredTypes.get(proto.constructor.name);
			if(inheritedProps != null)
				result.unshift(...inheritedProps);
			proto = Object.getPrototypeOf(proto);
		}
		
		BaseComponent.#RegisteredTypes.set(comp, result);
	}
	
	/// 
	/// 
	/// 
	static _DefineInspector(instance, compType, ...params)
	{
		if(!(instance instanceof BaseComponent))
			throw new Error("Invalid argument. Object derived from BaseComponent is expected.");
		
		let comp = compType.name;
		if(BaseComponent.#RegisteredInspectors.has(comp))
			return;
		
		let result = [];
		if(params != null && params.length > 0)
			result.push(...Array.from(params));
		
		//walk up the inheritance chain, gathering all inspector definitions
		let proto = Object.getPrototypeOf(instance);
		while(proto != null)
		{
			let inheritedProps = BaseComponent.#RegisteredInspectors.get(proto.constructor.name);
			if(inheritedProps != null)
				result.unshift(...inheritedProps);
			proto = Object.getPrototypeOf(proto);
		}
		
		BaseComponent.#RegisteredInspectors.set(comp, result);
	}
	
	static _BlacklistInspectorProperties(instance, compType, ...props)
	{
		if(!(instance instanceof BaseComponent))
			throw new Error("Invalid argument. Object derived from BaseComponent is expected.");
		
		let comp = compType.name;
		if(BaseComponent.#BlacklistedProperties.has(comp))
			return;
		
		let result = [];
		if(props != null)
			result.push(...Array.from(props));
		
		let proto = Object.getPrototypeOf(instance);
		while(proto != null)
		{
			let inheritedProps = BaseComponent.#BlacklistedProperties.get(proto.constructor.name);
			if(inheritedProps != null)
				result.unshift(...inheritedProps);
			proto = Object.getPrototypeOf(proto);
		}
		
		BaseComponent.#BlacklistedProperties.set(comp, result);
	}
	
	static _BlacklistInspectorObject(compType)
	{
		BaseComponent.#BlacklistedObjects.push(compType.name);
	}
	
	/// 
	/// Re-directs a property that the inspector binds to.
	/// 
	static _OverrideInspectorProperty(instance, compType, srcProp, destProp)
	{
		if(!(instance instanceof BaseComponent))
			throw new Error("Invalid argument. Object derived from BaseComponent is expected.");
		
		let comp = compType.name;
		let result = BaseComponent.#InspectorOverrides.get(comp);
		
		//NEED TO AVOID DUPES HERE!
		if(!result) result = [];
		else 
		{
			let index = result.map(x => x[0]).indexOf(srcProp);
			if(index >= 0)
				result[index] = [srcProp, dest];
		}
		
		result.push([srcProp, destProp]);
		let proto = Object.getPrototypeOf(instance);
		
		while(proto != null)
		{
			let inheritedProps = BaseComponent.#InspectorOverrides.get(proto.constructor.name);
			if(inheritedProps != null)
				result.unshift(...inheritedProps);
			proto = Object.getPrototypeOf(proto);
		}
		
		BaseComponent.#InspectorOverrides.set(comp, result);
	}
	/*
	/// 
	/// Obtains the list of properties that have been previously registered
	/// for serialization for a given component type.
	/// 
	static GetRegisteredSerializationProperties(compName)
	{
		let list = BaseComponent.#RegisteredTypes.get(compName);
		if(list == null)
		{
			ColorLog("Warning! Component type " + compName + " has not been registered for serialization.", "warning");
			return [];
		}
		return [...list];
	}
	
	/// 
	/// Obtains the list of inspector definitions that have 
	/// been previously registered for a given component type.
	/// 
	static GetRegisteredInspectorProperties(compName)
	{
		let list = BaseComponent.#RegisteredInspectors.get(compName);
		if(list == null)
		{
			ColorLog("Warning! Component type " + compName + " has not been registered for inspection.", "warning");
			return [];
		}
		return [...list];
	}
	
	static IsBlacklistedObject(compName)
	{
		return BaseComponent.#BlacklistedObjects.includes(compName);
	}
	
	static IsBlacklistedProperty(compName, propName)
	{
		let list = BaseComponent.#BlacklistedProperties.get(compName);
		return !list ? false : list.includes(propName);
	}
	
	static GetInspectorOverrideForProperty(compName, propName)
	{
		let list = BaseComponent.#InspectorOverrides.get(compName);
		if(!list) return null;
		let index = list.map(x => x[0]).indexOf(propName);
		if(index < 0) return null;
		return list[index][1];
	}*/
}

