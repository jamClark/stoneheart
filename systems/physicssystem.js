import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';
import Rigidbody from './rigidbody.js';
//import SpatialPartition from './../spacialpartion.js';
import Time from './../core/time.js';

/// 
/// 
/// 
export default class PhysicsSystem extends BaseComponentSystem
{
	
	constructor(ppm = 1)
	{
		super(WorldPos, Rigidbody);
		this.Gravity = new Vector2(0, -8);
		this.PixelsPerMeter = ppm;
		this.MinVel = 0.01;
	}
	
	/// 
	/// 
	/// 
	FixedProcess(entity, pos, body)
	{
		//apply accum from last frame first, that way if it was reset
		//since then, there is no effect.
		pos.Translate(body.Velocity);
		pos.Translate(body.Impulse);
		body.Impulse = Vector2.Zero;
		
		//dampening
		if(body.Velocity.SqrMag > this.MinVel)
			body.Velocity.Scale(1-body.Dampen);
		else body.Velocity = Vector2.Zero;
		
		//now apply gravity accum for next frame
		this.ApplyGravity(body);
	}
	
	ApplyGravity(body)
	{
		if(body.GravityScale > 0)
		{
			let inc = this.Gravity.Mul(body.GravityScale * Time.fixedDeltaTime);
			if (body.Velocity.SqrMag + inc.SqrMag < body.TerminalFallSpeed * body.TerminalFallSpeed)
				body.Velocity.Sum(inc.Mul(this.PixelsPerMeter));
		}
	}
}
