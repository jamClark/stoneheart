import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js'

/// 
/// Represents a camera in worldspace.
/// 
export default class Camera extends BaseComponent
{
	#VirtualX = 1;
	#VirtualY = 1;
	#WorldPosComp;
	#Canvas;
	
	constructor(canvas, virtualX, virtualY, worldPosComp)
	{
		super();
		this.#VirtualX = virtualX;
		this.#VirtualY = virtualY;
		
		this.#WorldPosComp = worldPosComp;
		this.#Canvas = canvas;
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