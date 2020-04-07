import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import WorldPosition from './worldpos.js';


TypedObject.RegisterFactoryMethod("SpriteRenderer", () => { return new SpriteRenderer(); });
TypedObject.RegisterType("SpriteRenderer", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SpriteRenderer");
	type.AddSerializedProp('Sprite','LocalOffset','Layer');
	type.AddInspectorProp(["Assets.Sprites","Sprite"], ["vector2","Local Offset"], ["enum","Render Layer"]);
});

/// 
/// 
/// 
export default class SpriteRenderer extends BaseComponent
{
	#Sprite = null;
	#LocalOffset = new Vector2(0, 0);
	
	constructor(sprite = null)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.FrameRect = [0, 0, 0, 0, 0, 0, 0, 0];
		this.DestScale = [1, 1];
		this.Layer = 0;
		this.Sprite = sprite;
	}
	
	get LocalOffset() { return new Vector2(this.#LocalOffset); }
	set LocalOffset(pos)
	{
		this.#LocalOffset.x = pos.x;
		this.#LocalOffset.y = pos.y;
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) 
	{
		if(sprite instanceof Promise)
			sprite.then(result => this.Sprite = result);
		else 
		{
			this.#Sprite = sprite;
			if(this.#Sprite != null)
				this.FrameRect = [0, 0, this.#Sprite.width, this.#Sprite.height, 0, 0, this.#Sprite.width, this.#Sprite.height];
		}
	}
	
}

