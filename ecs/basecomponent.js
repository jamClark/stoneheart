import {ColorLog} from './../core/utility.js';
import {GenerateUUID} from './../core/utility.js';
import Entity from './entity.js';
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
	#GUID = GenerateUUID();
	
	constructor()
	{
		super();
		this._Entity = null;
		this._RunOnce = true;
	}
	
	get GUID() { return this.#GUID; }
	_SetGUID(guid) { this.#GUID = guid; }
	get ECS() { return ECS; }
	
	static get AllowMultipleAttrName() { return 'AllowMultiple'; }
	
	ComposeSerializationData()
	{
		let type = TypedObject.GetType(this.type);
		let compList = [];
		compList.push(["TYPE", this.type]);
		compList.push(["GUID", this.#GUID]);
		for(let prop of type.SerializationList)
		{
			let propValue = this[prop];
			if(propValue == null || propValue.IsDestroyed)
				compList.push(["REF", "NONE", prop, null]);
			else if(propValue.srcPath)
				compList.push(["ASSET", prop, propValue.srcPath]);
			else if(propValue.GUID)
			{
				//reference to an object. is it a linkable one?
				if(propValue instanceof Entity)
					compList.push(["REF", "ENTITY", prop, propValue.GUID]);
				else if(propValue instanceof BaseComponent)
					compList.push(["REF", "COMP", prop, propValue.Entity.GUID, propValue.GUID]);
				else
				{
					ColorLog("Unserializable object type '" + prop + "'.");
					continue;
				}
			}
			else compList.push([prop, propValue]);
		}
		
		return compList;
	}
	
	Serialize()
	{
		return this.ComposeSerializationData();//JSON.stringify(this.ComposeSerializationData());
	}
	
	static Deserialize(entity, assetManager, strm, preserveGuid = false)
	{
		let obj = JSON.parse(strm);
		let comp = TypedObject.Activate(obj[0][1]);
		if(!(comp instanceof BaseComponent))
			throw new Error("Serialized information is not a component.");
		
		entity.AddComponent(comp);
		if(preserveGuid)
			comp._SetGUID(obj[1][1]);
		
		for(let i = 2; i < obj.length; i++)
		{
			let propType = obj[i][0];
			if(propType === "ASSET")
			{
				let propId = obj[i][1];
				let path = obj[i][2];
				let asset = assetManager.LoadAsset(path);
				comp[propId] = asset;
			}
			else if(propType === "REF")
			{
				//reference types, we'll need to find what it is refencing by guid
				let refType = obj[i][1];
				let propId = obj[i][2];
				let entGuid = obj[i][3];
				comp[propId] = null;
				
				if(refType === "NONE")
					continue;
				else if(refType === "ENTITY")
				{
					let promise = new Promise((resolve, fail) => {
						comp.Entity.Manager.ScheduleGuidSearch(entGuid, resolve, fail);
					});
					
					promise.then(
						result => { comp[propId] = result; },
						fail =>
						{
							console.log(fail); 
							comp[propId] = null;
						});
						
				}
				else if(refType === "COMP")
				{
					let compGuid = obj[i][4];
					//similar to the entity guid search above, but now with the added
					//fun of also looking for the attached component
					let promise = new Promise((resolve, fail) => {
						comp.Entity.Manager.ScheduleGuidSearch(entGuid, resolve, fail);
					});
					
					promise.then(
						result => { comp[propId] = result.FindComponentByGuid(compGuid); },
						fail =>
						{
							console.log(fail); 
							comp[propId] = null;
						});
				}
				else if(refType === "PREFAB")
				{
					throw new Error("Prefab-reference serialization not yet implemented.");
				}
			}
			//straight copy of a value-type
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
	
	get IsDestroyed()
	{
		return this.Entity == null || this.Entity.IsDestroyed;
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

