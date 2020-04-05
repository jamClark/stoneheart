import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import WorldPosition from './worldpos.js';

TypedObject.RegisterFactoryMethod("TiledSpriteRenderer", () => { return new TiledSpriteRenderer(); });
TypedObject.RegisterType("TiledSpriteRenderer", "BaseComponent", () =>
{
	let type = TypedObject.GetType("TiledSpriteRenderer");
	type.AddSerializedProp('Sprite', 'Layer', 'Width', 'Height', 'TextureOffset');
	type.AddInspectorProp(["Assets.Sprites","Sprite"], ["enum","Render Layer"], ["float","Width"], ["float","Height"], ["vector2","Texture Offset"]);
});


/// 
/// 
/// 
export default class TiledSpriteRenderer extends BaseComponent
{
	#Sprite = null;
	
	constructor(sprite = null)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.FrameRect = [0, 0, 0, 0, 0, 0, 0, 0];
		this.Rect = new Rect(0, 0, 64, 64);
		this.TextureOffset = new Vector2(0.0, 0.0);
		this.Layer = 0;
		this.Sprite = sprite;
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) 
	{
		if(sprite instanceof Promise)
			sprite.then(result => this.#Sprite = result);
		else this.#Sprite = sprite;
		if(this.#Sprite != null)
			this.FrameRect = [0, 0, this.#Sprite.width, this.#Sprite.height, 0, 0, this.#Sprite.width, this.#Sprite.height];
	}
	
	get Width() { return this.Rect.Width; }
	set Width(value) { this.Rect.Width = value; }
	
	get Height() { return this.Rect.Height; }
	set Height(value) { this.Rect.Height = value; }
	
}