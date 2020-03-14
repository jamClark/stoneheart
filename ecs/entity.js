import EntityMessage from './entitymessage.js';
import WorldPos from './../systems/worldpos.js';

/// 
/// Container and accessor for a set of components attached to a single object.
/// 
export default class Entity
{
	#Components = [];
	#Listeners = new Map();
	#GlobalListeners = new Map();
	#Active = false;
	
	constructor(name, ...comps)
	{
		this.name = name;
		for(let i = 0; i < comps.length; i++)
		{
			this.#Components.push(comps[i]);
			comps[i]._Entity = this;
			comps[i].OnAttached();
		}
		
		this.Active = true;
	}
	
	set Active(flag)
	{
		if(flag)
		{
			if(this.Active != flag)
			{
				for(let comp of this.#Components)
					comp.OnEnable();
			}
		}
		else
		{
			if(this.Active != flag)
			{
				for(let comp of this.#Components)
					comp.OnDisable();
			}
		}
		this.#Active = flag;
	}
	
	/// 
	/// Returns true if this entity is active.
	/// 
	get Active() { return this.#Active; }
	
	/// 
	/// Returns true if the entity and any parent entities it may have are all active.
	/// 
	get ActiveInHierarchy()
	{
		if(!this.#Active)
			return false;
		
		let trans = this.GetComponent(WorldPos);
		if(trans == null)
			return true;
			
		let p = trans.parent;
		while(p != null)
		{
			if(!p.Entity.Active())
				return false;
		}
		
		return true;
	}
	
	/// 
	/// Marks this entity for destruction. The actual removal and cleanup will occur
	/// during the next update cycle.
	/// 
	Destroy()
	{
		//let the manager know we can remove this entity on the next update
		this.DestroyPending = true;
	}
	
	/// 
	/// Invoked by the owning EntityManger on the next update after calling this.Destroy().
	/// 
	PostDestruction()
	{
		//destroy all components
		let comps = [...this.#Components];
		for(let comp of comps)
			comp.Destroy();
	}
	
	/// 
	/// Globally broadcasts a message that can be heard by any registered listener.
	/// 
	PostMessage(msg)
	{
		if(!(msg instanceof EntityMessage))
			throw new Error("Message object sent to global message post is not of type EntityMessage.");
		this._Manager.PostMessage(this, msg);
	}
	
	/// 
	/// Sends a message directly to an entity that has any registered listeners attached.
	/// 
	SendMessage(target, msg)
	{
		target.ReceiveMessage(this, msg);
	}
	
	/// 
	/// Stub for handling recieving messages either sent directly to this entity.
	/// 
	ReceiveMessage(sender, msg)
	{
		let handlers = this.#Listeners.get(msg.type);
		if(handlers == null) return;
		
		for(let handler of handlers)
			handler.HandleMessage(sender, msg);
	}
	
	/// 
	/// Stub for handling recieving messages posted globally.
	/// 
	ReceiveGlobalMessage(sender, msg)
	{
		let handlers = this.#GlobalListeners.get(msg.type);
		if(handlers == null) return;
		
		for(let handler of handlers)
			handler.HandleMessage(sender, msg);
	}
	
	/// 
	/// Registers an object as a listener for a specific message event.
	/// 
	AddListener(messageType, listener)
	{
		if(typeof listener != "object")
			throw new Error("Listener must be an object");
		if(typeof listener.HandleMessage != "function")
			throw new Error("Listener object must have a function named 'HandleMessage'");
		if(!messageType.IsEntityMessage)
			throw new Error("Message type being listened for must derive from 'EntityMessage'");
		
		let list = this.#Listeners.get(messageType.name.toString());
		if(list == null)
			list = [];
		list.push(listener);
		
		this.#Listeners.set(messageType.name.toString(), list);
	}
	
	/// 
	/// Registers an object as a listener for a specific message event.
	/// 
	AddGlobalListener(messageType, listener)
	{
		if(typeof listener != "object")
			throw new Error("Listener must be an object");
		if(typeof listener.HandleMessage != "function")
			throw new Error("Listener object must have a function named 'HandleMessage'");
		if(!messageType.IsEntityMessage)
			throw new Error("Message type being listened for must derive from 'EntityMessage'");
		
		this._Manager.AddListener(messageType, this);
		let list = this.#Listeners.get(messageType.name.toString());
		if(list == null)
			list = [];
		list.push(listener);
		
		this.#GlobalListeners.set(messageType.name.toString(), list);
	}
	
	/// 
	/// Unregisters a previously registered objects as a listener for a specific message event.
	/// 
	RemoveListener(messageType, listener)
	{
		if(typeof listener != "object")
			throw new Error("Listener must be an object");
		if(typeof listener.HandleMessage != "function")
			throw new Error("Listener object must have a function named 'HandleMessage'");
		
		let list = this.#Listeners.get(messageType.name.toString());
		if(list == null) return;
		let index = list.indexOf(listener);
		if(index >= 0) list.splice(index, 1);
		if(list.length < 1)
			this.#Listeners.delete(messageType.name.toString());
			
	}
	
	/// 
	/// Unregisters a previously registered objects as a listener for a specific message event.
	/// 
	RemoveGlobalListener(messageType, listener)
	{
		if(typeof listener != "object")
			throw new Error("Listener must be an object");
		if(typeof listener.HandleMessage != "function")
			throw new Error("Listener object must have a function named 'HandleMessage'");
			
		this._Manager.RemoveListener(messageType, this);
		
		let list = this.#Listeners.get(messageType.name.toString());
		if(list == null) return;
		let index = list.indexOf(listener);
		if(index >= 0) list.splice(index, 1);
		if(list.length < 1)
			this.#GlobalListeners.delete(messageType.name.toString());
			
	}
	
	HasComponents(...required)
	{
		return this.#Components.filter(comp => required.map(req => req.name).includes(comp.type)).length == required.length;
	}
	
	HasAnyComponents(...required)
	{
		return this.#Components.filter(comp => required.map(req => req.name).includes(comp.type)).length > 0;
	}
	
	QueryForComponentsByNamedArray(required)
	{
		let list = this.#Components.filter(comp => required.includes(comp.type) );
		if(list.length != required.length) return null;
		return Entity.ArrangeComponentsInRequiredOrder(list, required);
	}
	
	QueryForComponentsByName(...required)
	{
		return this.QueryForComponentsByNamedArray(Array.from(required));
	}
	
	QueryForComponents(...required)
	{
		return this.QueryForComponentsByName(...required.map(x => x.name.toString()));
	}
	
	AddComponent(component)
	{
		if(component != null)
		{
			this.#Components.push(component);
			component._Entity = this;
			component.OnAttached();
			component._InnerEnable();
		}
		
		return component;
	}
	
	RemoveComponent(component)
	{
		let index = this.#Components.indexOf(component);
		if(index > -1)
		{
			this.#Components.splice(index, 1);
			component._Entity = null;
			component.OnDisable();
			component.OnDetached();
		}
		return component;
	}
	
	/// 
	/// Returns the first found component of the matching type
	/// or null if no matches are found.
	/// 
	GetComponent(comp)
	{
		let name = (typeof comp === "string") ? comp : comp.name.toString();
		for(let c of this.#Components)
		{
			if(c.type == name)
				return c;
		}
		return null;
	}
	
	/// 
	/// Gets the value of a nested object property within a component on this entity.
	/// 
	GetProperty(path)
	{
		if(typeof path !== 'string')
			throw new Error("Invalid argument type sent to Entity.GetProperty().");
		
		let s = path.split("-");
		if(s.length != 2)
			throw new Error("Invalid property path: " + path);
			
		if(s[0] === 'Entity')
			return this[s[1]];
		
		let comp = this.GetComponent(s[0]);
		return s[1].split('.').reduce((o,i)=>o[i], comp);
	}
	
	/// 
	/// Sets the value of a nested object property within a component on this entity.
	/// 
	SetProperty(path, value)
	{
		if(typeof path !== 'string')
			throw new Error("Invalid argument type sent to Entity.SetProperty().");
		
		let s = path.split("-");
		if(s.length != 2)
			throw new Error("Invalid property path: " + path);
			
		if(s[0] === 'Entity')
		{
			this[s[1]] = value;
			return;
		}
		
		let comp = this.GetComponent(s[0]);
		
		//HACK ALERT: This really should be replaced with a
		//recursive method to avoid performance AND safety issues!
		eval('comp.' + s[1] + " = value");
	}
	
	/// 
	/// 
	/// 
	static ArrangeComponentsInRequiredOrder(given, expected)
	{
		let output = [];
		let givenNames = given.map(x => x.type);
		for(let i = 0; i < given.length; i++)
			output.push(given[givenNames.indexOf(expected[i])]);
		return output;
	}
	
}

