import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';

TypedObject.RegisterType("Rigidbody", "BaseComponent", () =>
{
	let type = TypedObject.GetType("Rigidbody");
	type.AddSerializedProp("GravityScale", "TerminalFallSpeed", "Dampen");
	type.AddInspectorProp(["float", "Gravity"], ["float","Terminal Spd"], ["float", "Dampen"]);
});

/// 
/// 
/// 
export default class Rigidbody extends BaseComponent
{
	#WorldPos;
	#Dampen;
	
	constructor(worldPos)
	{
		super();
		if(typeof worldPos == null)
			throw new Error("WorldPos component required for RigidBody");
			
		this.#WorldPos = worldPos;
		this.Velocity = new Vector2();
		this.GravityScale = 1.0;
		this.TerminalFallSpeed = -300;
		this.Dampen = 0.0;
		this.Impulse = Vector2.Zero;
		this.IsGrounded = false;
		//BaseComponent._RegisterComponentType(this, Rigidbody, ["GravityScale", "TerminalFallSpeed", "Dampen"]);
		//BaseComponent._DefineInspector(this, Rigidbody, ["float", "Gravity"], ["float","Terminal Spd"], ["float", "Dampen"]);
	}
	
	set Dampen(f) { this.#Dampen = (f > 1) ? 1 : (f < 0) ? 0 : f; }
	get Dampen() { return this.#Dampen; }
	
	get Position() { return this.#WorldPos.position; }
	
	
	/// 
	/// Removes all velocity and acceleration that is in the direction of the supplied vector.
	///
	NegateVelocity(dir)
	{
		let proj = this.Velocity.Dot(dir);
		if(proj > 0) 
			this.Velocity = this.Velocity.Sub(dir.Mul(proj));
	}
	
	/// 
	/// Adds an instant impulse to this body's velocity.
	/// 
	AddImpulse(vec)
	{
		this.Velocity.Sum(vec);
	}
	
	///
	/// Applies a movement vector to this object for a single frame only.
	Move(vec)
	{
		this.Impulse.Sum(vec);
	}
}
