import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import WorldPos from './worldpos.js';
import SmoothFollower from './smoothfollower.js';
import Vector2 from './../core/vector2.js';
import Time from './../core/time.js';
import MathUtil from './../core/mathutil.js';

/// 
/// Porcesses SmoothFollower objects by lineraly interpoltaing
/// their positions over time based on a followed target's position.
/// 
export default class SmoothFollowerSystem extends BaseComponentSystem
{
	constructor()
	{
		super(WorldPos, SmoothFollower);
	}
	
	Process(entity, trans, follower)
	{
		if(follower.Target == null)
			return;
		let pos = trans.position;
		
		pos.x = MathUtil.SmoothFollow(pos.x, follower.Target.position.x, follower.xSpeed, Time.deltaTime);
		pos.y = MathUtil.SmoothFollow(pos.y, follower.Target.position.y, follower.ySpeed, Time.deltaTime);
		trans.position = pos;
	}
	
	
}
