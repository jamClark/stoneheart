import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';

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
	
	constructor(sprite, rect, layer = 0)
	{
		super();
		this.Sprite = sprite;
		this.FrameRect = [0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height];
		this.Rect = rect;
		this.Layer = layer;
		this.TextureOffset = new Vector2(0.0, 0.0);
		//BaseComponent._RegisterComponentType(this, TiledSpriteRenderer, ['Sprite', 'Layer', 'Width', 'Height', 'TextureOffset']);
		//BaseComponent._DefineInspector(this, TiledSpriteRenderer, ["Assets.Sprites", "Sprite"], ["enum","Render Layer"], ["float","Width"], ["float","Height"], ["vector2","Texture Offset"]);
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) { this.#Sprite = sprite;	}
	
	get Width() { return this.Rect.Width; }
	set Width(value) { this.Rect.Width = value; }
	
	get Height() { return this.Rect.Height; }
	set Height(value) { this.Rect.Height = value; }
	
}