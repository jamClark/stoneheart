import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';

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
	
	constructor(sprite, layer = 0, xOffset = 0, yOffset = 0)
	{
		super();
		this.Sprite = sprite;
		this.FrameRect = [0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height];
		this.DestScale = [1, 1];
		this.LocalOffset = new Vector2(xOffset, yOffset);
		this.Layer = layer;
		//BaseComponent._RegisterComponentType(this, SpriteRenderer, ['Sprite','LocalOffset','Layer']);
		//BaseComponent._DefineInspector(this, SpriteRenderer, ["Assets.Sprites","Sprite"], ["vector2","Local Offset"], ["enum","Render Layer"]);
	}
	
	get Sprite() { return this.#Sprite; }
	set Sprite(sprite) { this.#Sprite = sprite; }
	
}

