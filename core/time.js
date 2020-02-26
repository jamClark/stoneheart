
const TIME_FRAC = 1000;
const FIXED_TIME_STEP = 16;//50; //20 updates per second  50/1000
const MAX_TIME_STEP = 500;  //2 updates per second	500/1000

/// 
/// 
/// 
export default class Time
{
	static _time = 0;
	static _lastTime = 0;
	static _accu = 0;
	
	static get TimeFrac() 		{ return TIME_FRAC; }
	static get FixedTimeStep() 	{ return FIXED_TIME_STEP; }
	static get MaxTimeStep() 	{ return MAX_TIME_STEP; } 
	
	static get time() 				{ return Time._time / Time.TimeFrac;}
	static get fixedDeltaTime()		{ return Time.FixedTimeStep / Time.TimeFrac; }
	static get deltaTime()			{ return Math.min((Time._time - Time._lastTime), Time.MaxTimeStep) / Time.TimeFrac; }
	static get interpolation()		{ return Math.max(0, Time._accu % Time.FixedTimeStep) / Time.TimeFrac ; }
	
	
	static UpdateTime(timeStamp)
	{
		//normally, accumulating time in a non-precise format like this is a terrible idea,
		//but these values should stay within a reasonable and predictable range so it shouldn't be an issue.
		Time._accu += timeStamp - Time._lastTime;
		Time._lastTime = Time._time;
		Time._time = timeStamp;
	}
	
	/// 
	/// This will consume any overflow in the time accumulated from 'UpdateTime' in 'FixedTimeStep' chunks.
	/// The passed functoin will be invoked for each consumed chunk. This allows us to catch up with any
	/// fraction portions of our fixed time step that overflowed during the normal update cycle.
	/// 
	static ConsumeAccumulatedTime(func)
	{
		let stepped = 0;
		let stepRate = FIXED_TIME_STEP;
		
		while(Time._accu >= stepRate)
		{
			stepped++;
			func();
			Time._accu -= stepRate;
			//this is a safety feature to ensure we never take longer than an allowed maximum time.
			if(Time._time - Time._lastTime > MAX_TIME_STEP)
			{
				Time._accu = 0;
				return false;
			}
		}
		
		return true;
	}
}

