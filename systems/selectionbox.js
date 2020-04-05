import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js'
import WorldPosition from './worldpos.js';
import BoxCollider from './boxcollider.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';

TypedObject.RegisterFactoryMethod("SelectionBox", () => { return new SelectionBox(64, 64); });
TypedObject.RegisterType("SelectionBox", "BaseComponent", () =>
{
	let type = TypedObject.GetType("SelectionBox");
	type.AddSerializedProp('Width', 'Height');
	type.AddInspectorProp(["float","Width"], ["float", "Height"]);
	type.BlacklistInspectorObject();
	type.AddAttribute("NoMenuDisplay");
});

/// 
/// Provides a means of selecting an Entity using a mouse during edit-mode.
/// The selection region will be the size of the BoxCollider if one is present
/// on the Entity, otherwise it will use a default value of 32x32.
/// 
export default class SelectionBox extends BaseComponent
{
	#Size;
	
	constructor(width = 32, height = 32)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.#Size = new Vector2(width, height);
	}
	
	//override these so that we can never disable this component
	get enabled() { return true; }
	set enabled(value) {};
	
	get WorldRect()
	{
		let trans = this.Entity.GetComponent(WorldPosition);
		if(trans == null)
			throw new Error("Missing WorldPos component!");
		
		let col = this.Entity.GetComponent(BoxCollider);
		return (col != null) ? col.WorldRect(trans.position) : this.TranslatedWorldRect(trans.position);
	}
	
	TranslatedWorldRect(worldPos)
	{
		return new Rect(worldPos.x, worldPos.y, this.#Size.x, this.#Size.y);
	}
	
	get Width() { return this.#Size.x; }
	set Width(value) { this.#Size.x = value; }
	get Height() { return this.#Size.y; }
	set Height(value) { this.#Size.y = value; }
}