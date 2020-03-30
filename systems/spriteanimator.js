import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';

TypedObject.RegisterType("SpriteAnimator", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SpriteAnimator");
	type.AddSerializedProp("AnimAsset","Speed","CurrentAnim");
	type.AddInspectorProp(["Assets.Anims","Anim Src"], ["float","Speed"], ["string","Animation"]);
});

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
		//BaseComponent._RegisterComponentType(this, SpriteAnimator, ['AnimAsset',"Speed","CurrentAnim"]);
		//BaseComponent._DefineInspector(this, SpriteAnimator, ["Assets.Anims","Anim Src"], ["float","Speed"], ["string","Animation"]);
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
		let curr = this.AnimAsset["Anims"].get(this.#CurrentAnim);
		if(!curr) return;
		
		this.#CurrentAnim = animName;
		this.#CurrentFrame = curr[0];
	}
	
	get CurrentAnim() { return this.#CurrentAnim; }
	
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
