import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import CollisionSystem from './collisionsystem.js'

TypedObject.RegisterFactoryMethod("BoxCollider", () => { return new BoxCollider(); });
TypedObject.RegisterType("BoxCollider", "BaseComponent", () =>
{
	let type = TypedObject.GetType("BoxCollider");
	type.AddSerializedProp('Layer', 'LayerMask', 'Width', 'Height', 'IsTrigger', 'IsStatic');
	type.AddInspectorProp(["enum","Collision Layer"], ["bitmask","Collision Mask"], ["float","Width"], ["float","Height"], ["bool","Trigger"], ["bool","Static"]);

});



/// 
/// Represents an AABB collision area.
/// 
/// Can be marked as static or dynamic. Static objects are assumed to move 
/// infrequently and never check against anything else. Dynamic objects
/// check for collision against other dynamic objects and static objects. 
///
/// Can be marked as trigger or collider. Only static objects can be triggers. Dynamic 
/// objects will collide and depenetrate against colliders but will simply register a 
/// collision event with triggers. Dynamic-dynamic collisions are always treated as triggers
/// and provide no physical collision response.
/// 
export default class BoxCollider extends BaseComponent
{
	#Rect;
	#CollisionSystem;
	#LayerMask;
	#IsTrigger; //this is considered a 'collider' if it's not a 'trigger'
	#IsStatic;
	
	constructor(rect = null)
	{
		super();
		this.#Rect = (rect == null) ? new Rect(0, 0, 64, 64) : new Rect(rect);
		this.#LayerMask = CollisionSystem.Layers.LayerAll;
		this.#CollisionSystem = this.ECS.Get("collisionsystem");
		
		this.#IsTrigger = false;
		this.#IsStatic = false;
	}
	
	get IsTrigger() { return this.#IsTrigger; }
	set IsTrigger(value)
	{
		if(value != this.#IsTrigger)
		{
			this.#CollisionSystem.Unregister(this);
			this.#CollisionSystem.Register(this, true);
		}
		this.#IsTrigger = value;
	}
	
	get IsStatic() { return this.#IsStatic; }
	set IsStatic(value)
	{
		if(value != this.#IsStatic)
		{
			this.#CollisionSystem.Unregister(this);
			this.#CollisionSystem.Register(this, true);
		}
		this.#IsStatic = value;
	}
		
	set Layer(layerIndex)
	{
		throw new Error("Not yet implemented");
	}
	
	get Layer()
	{
		throw new Error("Not yet implemented");
	}
	
	get LayerMask()
	{
		return this.#LayerMask;
	}
	
	OnAttached()
	{
		this.#CollisionSystem.Register(this);
	}
	
	OnDetached()
	{
		this.#CollisionSystem.Unregister(this);
	}
	
	get Width() { return this.#Rect.Width; }
	set Width(value) { this.#Rect.Width = value; }

	get Height() { return this.#Rect.Height; }
	set Height(value) { this.#Rect.Height = value;}
	
	get LocalPos() { return this.#Rect.Center; }
	get BoxRect() { return new Rect(this.#Rect); }
	
	WorldRect(worldPos)
	{
		if(!(worldPos instanceof Vector2))
			throw new Error("Invalid arugement. Expected Vector2.");
		
		let r = new Rect(this.#Rect);
		r.Center = r.Center.Add(worldPos);
		return r;
	}
}