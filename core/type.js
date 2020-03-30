
/// 
/// A base class that provides RTTI meta information for any class deriving from it.
/// 
export default class TypedObject
{
	#TypeName;
	
	constructor()
	{
		this.#TypeName = this.constructor.name;
	}
	
	get TypeName() { return this.#TypeName; }
	
	GetType()
	{
		return TypedObject.GetType(this.#TypeName);
	}
	
	
	static #RegisteredTypes = new Map();
	
	static GetType(typeName)
	{
		return TypedObject.#RegisteredTypes.get(typeName);
	}
	
	static RegisterType(typeName, protoName, callback)
	{
		let type = new Type(typeName, protoName);
		TypedObject.#RegisteredTypes.set(typeName, type);
		if(callback != null)
			callback();
	}
}


/// 
/// Stores meta information for a TypedObject.
/// 
export class Type
{
	#Name = "";
	#ParentTypeName = null;
	#Attributes = [];
	#SerializeWhitelist = [];
	#SerializeBlacklist = [];
	
	#InspectorProps = [];
	#InspectorBlacklist = [];
	#OverridenInspectorProps = [];
	static #BlacklistedInspectorObjects = [];
	
	constructor(name, parentName)
	{
		this.#Name = name;
		this.#ParentTypeName = parentName;
	}
	
	get Name() { return this.#Name; }
	get ParentName() { return this.#ParentTypeName; }
	get Attributes() { return [...this.#Attributes]; }
	HasAttribute(attr) { return this.#Attributes.includes(attr) != null; }
	
	get SerializationList()
	{
		let list = [];
		let parentType = TypedObject.GetType(this.ParentName);
		while(parentType != null)
		{
			list.push(...parentType.SerializationList);
			parentType = TypedObject.GetType(parentType.ParentName);
		}
		list.push(...this.#SerializeWhitelist);
		let outterThis = this;
		return list.filter(x => !outterThis.#SerializeBlacklist.includes(x));
	}
	
	get InspectorProps()
	{
		let list = [];
		let parentType = TypedObject.GetType(this.ParentName);
		while(parentType != null)
		{
			list.push(...parentType.InspectorProps);
			parentType = TypedObject.GetType(parentType.ParentName);
		}
		list.push(...this.#InspectorProps);
		return list;
	}
	
	IsBlacklistedInspectorProperty(displayName)
	{
		return this.#InspectorBlacklist.includes(displayName);
	}
	
	AddAtrribute(...attrNames)
	{
		for(let attrName of attrNames)
			this.#Attributes.push(propName);
	}
	
	AddSerializedProp(...propNames)
	{
		for(let propName of propNames)
			this.#SerializeWhitelist.push(propName);
	}
	
	BlacklistSerializedProp(...propNames)
	{
		for(let propName of propNames)
			this.#SerializeBlacklist.push(propName);
	}
	
	OverrideInspectorProp(...props)
	{
		//TODO: when we recursively get props from base classes, we should ensure
		//derived classes with the same overrides take precidence
		for(let prop of props)
			this.#OverridenInspectorProps.push(props);
	}
	
	AddInspectorProp(...props)
	{
		for(let prop of props)
			this.#InspectorProps.push(prop);
	}
	
	BlacklistInspectorProp(...props)
	{
		for(let prop of props)
			this.#InspectorBlacklist.push(prop);
	}
	
	BlacklistInspectorObject()
	{
		Type.BlacklistInspectorType(this.#Name);
	}
	
	get IsBlacklistedInspectorObject()
	{
		return Type.IsBlacklistedInspectorType(this.#Name);
	}
	
	static BlacklistInspectorType(typeName)
	{
		Type.#BlacklistedInspectorObjects.push(typeName);
	}
	
	static IsBlacklistedInspectorType(typeName)
	{
		return Type.#BlacklistedInspectorObjects.includes(typeName);
	}
}

