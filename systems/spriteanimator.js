import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import SpriteRenderer from './spriterenderer.js';

TypedObject.RegisterFactoryMethod("SpriteAnimator", () => { return new SpriteAnimator(); });
TypedObject.RegisterType("SpriteAnimator", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SpriteAnimator");
	type.AddSerializedProp("AnimAsset","Speed","CurrentAnim");
	type.AddInspectorProp(["Assets.Anims","Asset"], ["float","Speed"], ["string","Animation"]);
});

/// 
/// 
/// 
export default class SpriteAnimator extends BaseComponent
{
	#CurrentAnim = "Idle";
	#CurrentFrame = 0;
	#LastFrameTime = 0;
	#Anim = null;
	
	constructor(animAsset = null)
	{
		super();
		this.RequireComponent(SpriteRenderer);
		this.AnimAsset = animAsset;
		this.Speed = 1;
	}
	
	get AnimAsset() { return this.#Anim; }
	set AnimAsset(asset = null)
	{
		if(asset instanceof Promise)
			asset.then(result => this.AnimAsset = result);
		else this.#Anim = asset;
	}
	
	get CurrentSrcFrameData()
	{
		if(this.AnimAsset == null) return null;//[0,0,0,0,0,0,0,0];
		return this.AnimAsset["Frames"][this.#CurrentFrame];
	}
	
	get CurrentFrameDuration()
	{
		if(this.AnimAsset == null) return 0;
		return this.AnimAsset["Frames"][this.#CurrentFrame]["Duration"];
	}
	
	set CurrentAnim(animName)
	{
		this.#CurrentAnim = animName;
		if(this.AnimAsset == null) return;
		let curr = this.AnimAsset["Anims"].get(this.#CurrentAnim);
		if(!curr) return;
		
		this.#CurrentFrame = curr[0];
	}
	
	get CurrentAnim() { return this.#CurrentAnim; }
	
	CycleFrame(currentTime, inc = 1)
	{
		if(this.AnimAsset == null) return;
		let range = this.AnimAsset["Anims"].get(this.#CurrentAnim);
		if(range == null) return;
		
		//TODO: increment based on time elapsed and frame time
		if((currentTime*1000) - this.#LastFrameTime > this.CurrentFrameDuration/this.Speed)
		{
			this.#CurrentFrame += inc;
			this.#LastFrameTime = currentTime*1000;
		}
		
		
		
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
