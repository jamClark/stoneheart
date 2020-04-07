import {ColorLog} from './../core/utility.js';
import TypedObject from './../core/type.js';
import ECS from './ecs.js';

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
	
	get ECS() { return ECS; }
	
	static get AllowMultipleAttrName() { return 'AllowMultiple'; }
	
	ComposeSerializationData()
	{
		let type = TypedObject.GetType(this.type);
		let compList = [];
		compList.push(["TYPE", this.type]);
		for(let prop of type.SerializationList)
		{
			if(this[prop].srcPath)
				compList.push(["ASSET", prop, this[prop].srcPath]);
			else compList.push([prop, this[prop]]);
		}
		
		return compList;
	}
	
	Serialize()
	{
		return this.ComposeSerializationData();//JSON.stringify(this.ComposeSerializationData());
	}
	
	static Deserialize(entity, assetManager, strm)
	{
		let obj = JSON.parse(strm);
		let comp = TypedObject.Activate(obj[0][1]);
		if(!(comp instanceof BaseComponent))
			throw new Error("Serialized information is not a component.");
		
		entity.AddComponent(comp);
		//TODO: If we ever implement referencing to other objects, we'll need to store and check the data type here
		for(let i = 1; i < obj.length; i++)
		{
			if(obj[i][0] === "ASSET")
			{
				let path = obj[i][2];
				let asset = assetManager.LoadAsset(obj[i][2]);
				comp[obj[i][1]] = asset;
			}
			else comp[obj[i][0]] = obj[i][1];
		}
		
		return comp;
	}
	
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
	
	GetComponent(compType)
	{
		return this.Entity.GetComponent(compType);
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
	
	RequireComponent(type)
	{
		console.log("TODO: Implemented 'BaseComponent.RequireComponent()'.");
	}
	
	/// 
	/// Copies registered serializeable values from a source component to this one.
	/// 
	CopySettings(src)
	{
		if(src.type != this.type)
			throw new Error("Cannot copy settings from mis-matched component types.");
		
		let type = src.GetType();
		let dataList = type.SerializationList;
		for(let propName of dataList)
			this[propName] = src[propName];
	}
	
}

