import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import SmoothFollower from './smoothfollower.js';

TypedObject.RegisterFactoryMethod("FollowOnEvent", () => { return new FollowOnEvent(); });
TypedObject.RegisterType("FollowOnEvent", "BaseComponent", () =>
{
	let type = TypedObject.GetType("FollowOnEvent");
	type.AddSerializedProp('EventName');
	type.AddInspectorProp(["string","Event Name"]);
});


/// 
/// Links this entity's SmoothFollower to the sender of a given event.
/// 
export default class FollowOnEvent extends BaseComponent
{
	#EventName = null;
	
	constructor()
	{
		super();
	}
	
	get EventName() { return this.#EventName; }
	set EventName(name)
	{
		if(this.enabled)
			this.Entity.RemoveGlobalListenerByName(this.#EventName, this);
		this.#EventName = name;
		if(this.enabled)
			this.Entity.AddGlobalListenerByName(this.#EventName, this);
	}
	
	OnEnable()
	{
		if(this.#EventName != null && this.#EventName.length > 0)
			this.Entity.AddGlobalListenerByName(this.#EventName, this);
	}
	
	OnDisable()
	{
		if(this.#EventName != null && this.#EventName.length > 0)
			this.Entity.RemoveGlobalListenerByName(this.#EventName, this);
	}
	
	HandleMessage(sender, msg)
	{
		let follower = this.Entity.GetComponent(SmoothFollower);
		if(follower) follower.Target = sender;
	}
}