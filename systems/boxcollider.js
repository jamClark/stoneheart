import BaseComponent from './../ecs/basecomponent.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import CollisionSystem from './collisionsystem.js'



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
	
	constructor(collisionSystem, rect, isTrigger = false, isStatic = false)
	{
		super();
		if(!(collisionSystem instanceof CollisionSystem))
			throw new Error("Argument is not of type 'CollisionSystem'");
		
		this.#Rect = new Rect(rect);
		this.IsTrigger = isTrigger; //this is considered a 'collider' if it's not a 'trigger'
		this.IsStatic = isStatic;
		this.#CollisionSystem = collisionSystem;
		this.#LayerMask = CollisionSystem.Layers.LayerAll;
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
	
	get Width() { return this.#Rect.width; }
	get Height() { return this.#Rect.height; }
	get LocalPos() { return this.#Rect.Center; }
	get BoxRect() { return new Rect(this.#Rect); }
	
	WorldRect(worldPos)
	{
		let r = new Rect(this.#Rect);
		r.Center = r.Center.Add(worldPos);
		return r;
	}
}