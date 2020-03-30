import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import WorldPos from './worldpos.js';

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
		this.Target = null;
		this.xSpeed = xSpeed;
		this.ySpeed = ySpeed;
		//BaseComponent._RegisterComponentType(this, SmoothFollower, ['xSpeed', 'ySpeed']);
		//BaseComponent._DefineInspector(this, SmoothFollower, ["float","Speed X"], ["float","Speed Y"]);
	}
	
	SetTarget(target)
	{
		if(target != null && !(target instanceof WorldPos))
			throw new Error("Follower target must be a WorldPos component.");
		this.Target = target;
	}
}