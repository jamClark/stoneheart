import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import WorldPosition from './worldpos.js';

TypedObject.RegisterFactoryMethod("SmoothFollower", () => { return new SmoothFollower(); });
TypedObject.RegisterType("SmoothFollower", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SmoothFollower");
	type.AddSerializedProp('xSpeed', 'ySpeed');
	type.AddInspectorProp(["float","Speed X"], ["float","Speed Y"]);
});

/// 
/// 
/// 
export default class SmoothFollower extends BaseComponent
{
	constructor(xSpeed = 1, ySpeed = 1)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.Target = null;
		this.xSpeed = xSpeed;
		this.ySpeed = ySpeed;
	}
	
	SetTarget(target)
	{
		if(target != null && !(target instanceof WorldPosition))
			throw new Error("Follower target must be a WorldPosition component.");
		this.Target = target;
	}
}