

export default class MathUtil
{
	/// 
	/// Basic linear interpolation for a single dimension.
	/// 
	static Lerp(a, b, t)
	{
		return a*(1-t) + b*t;
	}
	
	/// 
	/// Manual smoothing function for a single dimension.
	/// 
	static SmoothApproach(pastPosition, pastTargetPosition, targetPosition, speed, deltaTime)
	{
		let t = deltaTime * speed;
		let v = (targetPosition - pastTargetPosition) / Math.max(t, 0.00001);
		let f = pastPosition - pastTargetPosition + v;
		return targetPosition - v + f * Math.exp(-t);
	}
	
	/// 
	/// 
	/// 
	static SmoothFollow(current, target, speed, delta)
	{
		let dt = Math.max(speed, 0);
		//dt = 1.0 - Math.exp(1.0 - dt, delta);
		
		//if (Math.abs(current - target) < 1) 
		//	return target;
		//else
			return current + (target - current) * dt;
	}
}