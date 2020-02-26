import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';

/// 
/// Component that respresent a 2D world-position value.
/// 
export default class WorldPosition extends BaseComponent
{
	#Parent = null;
	#LocalPos = new Vector2();
	
	constructor(x = 0, y = 0)
	{
		super();
		if(x instanceof Vector2)
			this.#LocalPos = new Vector2(x);
		else this.#LocalPos = new Vector2(x, y);
	}
	
	get localPosition() { return new Vector2(this.#LocalPos); }
	get position()
	{
		let x = this.#LocalPos.x;
		let y = this.#LocalPos.y;
		let p = this.#Parent;
		while(p != null)
		{
			x += p.#LocalPos.x;
			y += p.#LocalPos.y;
			p = p.#Parent;
		}
		
		return new Vector2(x, y);
	}
	set position(pos)
	{
		if(this.#Parent == null)
		{
			this.#LocalPos.x = pos.x;
			this.#LocalPos.y = pos.y;
		}
		else
		{
			this.#LocalPos.x = pos.x - this.#Parent.position.x;
			this.#LocalPos.y = pos.y - this.#Parent.position.y;
		}
	}
	
	Translate(x, y)
	{
		if(x instanceof Vector2)
			this.#LocalPos.Sum(x);
		else
		{
			this.#LocalPos.x += x;
			this.#LocalPos.y -= y;
		}
	}
	
	GetParent()
	{
		return this.#Parent;
	}
	
	SetParent(parent, worldPositionStays = false)
	{
		if(!(parent instanceof WorldPos))
			throw new Error("Parent of WorldPos transform must be of type WorldPos");
		
		this.#Parent = parent;
	}
}