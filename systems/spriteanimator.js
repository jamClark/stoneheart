import BaseComponent from './../ecs/basecomponent.js';

/// 
/// 
/// 
export default class SpriteAnimator extends BaseComponent
{
	#CurrentAnim = "Idle";
	#CurrentFrame = 0;
	#LastFrameTime = 0;
	
	constructor(animAsset)
	{
		super();
		this.AnimAsset = animAsset;
		this.Speed = 1;
	}
	
	get CurrentSrcFrameData()
	{
		if(this.AnimAsset == null) return [0,0,0,0,0,0,0,0];
		return this.AnimAsset["Frames"][this.#CurrentFrame];
	}
	
	get CurrentFrameDuration()
	{
		if(this.AnimAsset == null) return 0;
		return this.AnimAsset["Frames"][this.#CurrentFrame]["Duration"];
	}
	
	set CurrentAnim(animName)
	{
		if(this.AnimAsset == null) return;
		
		this.#CurrentAnim = animName;
		this.#CurrentFrame = this.AnimAsset["Anims"].get(this.#CurrentAnim)[0];
	}
	
	CycleFrame(currentTime, inc = 1)
	{
		if(this.AnimAsset == null) return;
		
		//TODO: increment based on time elapsed and frame time
		if((currentTime*1000) - this.#LastFrameTime > this.CurrentFrameDuration/this.Speed)
		{
			this.#CurrentFrame += inc;
			this.#LastFrameTime = currentTime*1000;
		}
		
		
		let range = this.AnimAsset["Anims"].get(this.#CurrentAnim);
		if(this.#CurrentFrame > range[1])
			this.#CurrentFrame = range[0];
		else if(this.#CurrentFrame < range[0])
			this.#CurrentFrame = range[1];
	}
	
	///
	/// Begins playing an animation if it is not already playing.
	/// 
	PlayAnim(animName)
	{
		if(this.#CurrentAnim != animName)
			this.CurrentAnim = animName;
	}
}
