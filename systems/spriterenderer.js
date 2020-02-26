import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';



/// 
/// 
/// 
export default class SpriteRenderer extends BaseComponent
{
	#Sprite = null;
	
	constructor(sprite, layer = 0, xOffset = 0, yOffset = 0)
	{
		super();
		this.Sprite = sprite;
		this.FrameRect = [0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height];
		this.DestScale = [1, 1];
		this.LocalOffset = new Vector2(xOffset, yOffset);
		this.Layer = layer;
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) { this.#Sprite = sprite; }
	
}

