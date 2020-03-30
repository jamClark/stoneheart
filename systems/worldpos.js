import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';

TypedObject.RegisterType("WorldPosition", "BaseComponent", () =>
{
	let type = TypedObject.GetType("WorldPosition");
	type.AddSerializedProp('localPosition');
	type.AddInspectorProp(["vector2","Position"]);
	type.BlacklistInspectorProp('enabled');
	//type.OverrideInspectorProp(['localPosition', 'position']);
});


/// 
/// Component that respresent a 2D world-position value.
/// 
/// TODO: We need to propogate movement events to all children.
///       The best place to do this would be in the localPosition property as
///		  we can always be sure to use that for changing this object's position.
///		  At the time we're not using the localPosition property all of the time.
///		  This will need to be changed.
/// 
export default class WorldPosition extends BaseComponent
{
	#Parent = null;
	#Children = [];
	#LocalPos = new Vector2();
	
	constructor(x = 0, y = 0)
	{
		super();
		if(x instanceof Vector2)
			this.#LocalPos = new Vector2(x);
		else if(typeof x === 'object')
			this.#LocalPos = new Vector2(x.x, x.y);
		else this.#LocalPos = new Vector2(x, y);
	}
	
	
	//override these so that we can never disable this component
	get enabled() { return true; }
	set enabled(value) {};
	
	
	get localPosition() { return new Vector2(this.#LocalPos); }
	set localPosition(value) 
	{ 
		//TODO: propogate changes to the children!!
		this.#LocalPos.x = value.x;
		this.#LocalPos.y = value.y;
	}
	
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
	
	//NOTE: 
	//We are using a cached Vector2 so that we can still set the position using a Vector2 but we won't
	//generate garbage this way. The reason we need to pass a Vector2 to the 'localPosition' property
	//rather than directly updating the internal values of #LocalPosition is because we want to ensure
	//shadows attached to the 'localPosition' property are properly updated even when changing the
	//world 'position' property.
	static #Vec2Cached = new Vector2();
	set position(pos)
	{
		if(this.#Parent == null)
		{
			WorldPosition.#Vec2Cached.x = pos.x;
			WorldPosition.#Vec2Cached.y = pos.y;
			this.localPosition = WorldPosition.#Vec2Cached;
		}
		else
		{
			WorldPosition.#Vec2Cached.x = pos.x - this.#Parent.position.x;
			WorldPosition.#Vec2Cached.y = pos.y - this.#Parent.position.y;
			this.localPosition = WorldPosition.#Vec2Cached;
		}
	}
	
	Translate(x, y)
	{
		if(x instanceof Vector2)
		{
			WorldPosition.#Vec2Cached.x = this.#LocalPos.x + x.x;
			WorldPosition.#Vec2Cached.y = this.#LocalPos.y + x.y;
			this.localPosition = WorldPosition.#Vec2Cached;
		}
		else
		{
			WorldPosition.#Vec2Cached.x = this.#LocalPos.x + x;
			WorldPosition.#Vec2Cached.y = this.#LocalPos.y + y;
			this.localPosition = WorldPosition.#Vec2Cached;
		}
	}
	
	GetParent()
	{
		return this.#Parent;
	}
	
	SetParent(parent, worldPositionStays = false)
	{
		if(parent != null && !(parent instanceof WorldPosition))
			throw new Error("Parent of WorldPos transform must be of type WorldPos");
		
		if(parent == null && this.#Parent != null)
		{
			let index = this.#Parent.indexOf(this);
			this.#Parent.splice(index, 1);
		}
		this.#Parent = parent;
		if(parent != null)
			parent.#Children.push(this);
		
		//TODO: let children know about their change in localSpace due to being parented!!
	}
	
	get ChildCount() { return this.#Children.length; }
	
	GetChild(index)
	{
		return this.#Children[index];
	}
	
	get Children() { return [...this.#Children]; }
}