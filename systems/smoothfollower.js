import BaseComponent from './../ecs/basecomponent.js';
import WorldPos from './worldpos.js';

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
	}
	
	SetTarget(target)
	{
		if(target != null && !(target instanceof WorldPos))
			throw new Error("Follower target must be a WorldPos component.");
		this.Target = target;
	}
}