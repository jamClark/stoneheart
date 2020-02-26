import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import SpriteAnimator from './spriteanimator.js';
import SpriteRenderer from './spriterenderer.js';
import Vector2 from './../core/vector2.js';
import Time from './../core/time.js';


/// 
/// 
/// 
export default class SpriteAnimatorSystem extends BaseComponentSystem
{
	constructor()
	{
		super(SpriteAnimator, SpriteRenderer);
	}
	
	Process(entity, animator, spriteComp)
	{
		animator.CycleFrame(Time.time);
		let data = animator.CurrentSrcFrameData;
		spriteComp.FrameRect = [
			data["SrcFrame"][0],
			data["SrcFrame"][1],
			data["SrcSize"][0],
			data["SrcSize"][1],
			data["Offset"][0],
			data["Offset"][1],
			animator.AnimAsset["OriginalFrameSize"][0],
			animator.AnimAsset["OriginalFrameSize"][1]
		];
	}
}
