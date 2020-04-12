import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import SmoothFollower from './smoothfollower.js';

TypedObject.RegisterFactoryMethod("FollowEndOnEvent", () => { return new FollowEndOnEvent(); });
TypedObject.RegisterType("FollowEndOnEvent", "BaseComponent", () =>
{
	let type = TypedObject.GetType("FollowEndOnEvent");
	type.AddSerializedProp('EventName');
	type.AddInspectorProp(["string","Event Name"]);
});


/// 
/// Links this entity's SmoothFollower to the sender of a given event.
/// 
export default class FollowEndOnEvent extends BaseComponent
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
		this.Entity.AddGlobalListenerByName(this.#EventName, this);
	}
	
	OnDisable()
	{
		this.Entity.RemoveGlobalListenerByName(this.#EventName, this);
	}
	
	HandleMessage(sender, msg)
	{
		let follower = this.Entity.GetComponent(SmoothFollower);
		if(follower) follower.Target = null;
	}
}