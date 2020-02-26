import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';


/// 
/// 
/// 
export default class TiledSpriteRenderer extends BaseComponent
{
	#Sprite = null;
	
	constructor(sprite, rect, layer = 0)
	{
		super();
		this.Sprite = sprite;
		this.FrameRect = [0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height];
		this.Rect = new Rect(rect);
		this.Layer = layer;
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) { this.#Sprite = sprite;	}
	
}