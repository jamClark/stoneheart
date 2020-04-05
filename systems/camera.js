import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import WorldPosition from './worldpos.js';

TypedObject.RegisterFactoryMethod("Camera", () => { return new Camera; });
TypedObject.RegisterType("Camera", "BaseComponent", () =>
{
	let type = TypedObject.GetType("Camera");
	type.AddAttribute("NoMenuDisplay");
});

/// 
/// Represents a camera in worldspace.
/// 
export default class Camera extends BaseComponent
{
	#VirtualX;
	#VirtualY;
	#Canvas;	
	#WorldPosComp;
	
	constructor(virtualX = 640, virtualY = 480)
	{
		super();
		this.RequireComponent(WorldPosition);
		this.#VirtualX = virtualX;
		this.#VirtualY = virtualY;
		this.#Canvas = this.ECS.Get("canvas");
		
		console.log("Camera: Canvas = " + this.#Canvas);
	}
	
	Awake()
	{
		this.#WorldPosComp = this.Entity.GetComponent(WorldPosition);
	}
	
	get VirtualX() { return this.#VirtualX; }
	get VirtualY() { return this.#VirtualY; }
	
	/// 
	/// Returns a screen position that is scaled by the virtual resolution.
	/// 
	ScaledCameraPos(pos)
	{
		return new Vector2(
			pos.x * (this.#Canvas.width / this.#VirtualX), 
			pos.y * (this.#Canvas.height / this.#VirtualY));
	}
	
	WorldToView(pos)
	{
		let x = pos.x + (this.#Canvas.width * 0.5) - this.#WorldPosComp.position.x;
		let y = -pos.y + (this.#Canvas.height * 0.5) + this.#WorldPosComp.position.y;
		return new Vector2(x, y);
	}
	
	ViewToWorld(pos)
	{
		let x = pos.x - (this.#Canvas.width * 0.5) + this.#WorldPosComp.position.x;
		let y = -(pos.y - (this.#Canvas.height * 0.5) - this.#WorldPosComp.position.y);
		return new Vector2(x, y);
	}
}