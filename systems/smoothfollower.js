import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import ReferenceWrapper from './../ecs/referencewrapper.js';
import WorldPosition from './worldpos.js';


TypedObject.RegisterFactoryMethod("SmoothFollower", () => { return new SmoothFollower(); });
TypedObject.RegisterType("SmoothFollower", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SmoothFollower");
	type.AddSerializedProp('xSpeed', 'ySpeed', 'Target');
	type.AddInspectorProp(["float","Speed X"], ["float","Speed Y"], ["component", "WorldPosition", "Target"]);
});


/// 
/// 
/// 
export default class SmoothFollower extends BaseComponent
{
	#Target = new ReferenceWrapper(null);		
	
	constructor(xSpeed = 1, ySpeed = 1)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.Target = null;
		this.xSpeed = xSpeed;
		this.ySpeed = ySpeed;
	}
	
	//due to the fact that we might have a reference to an object that's been destroyed 
	//but not removed from memory, wee need to check this here
	get Target() { return this.#Target.Ref; }
	set Target(target)
	{
		if(target != null && !(target instanceof WorldPosition))
			throw new Error("Follower target must be a WorldPosition component.");
		this.#Target.Ref = target;
	}
}
