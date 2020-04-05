import TypedObject from './../core/type.js';
import BaseComponent from './../ecs/basecomponent.js';
import Vector2 from './../core/vector2.js';
import Time from './../core/time.js';

TypedObject.RegisterType("Particle", "BaseComponent", () =>
{
	let type = TypedObject.GetType("Particle");
	type.AddAttribute("NoMenuDisplay");
});

/// 
/// State information for a single particle of a particle system.
/// 
export default class Particle extends BaseComponent
{
	constructor()
	{
		super();
		//this.Scale = new Vector2(1, 1); //not currently used
		this.Velocity = new Vector2(0, 0);
		this.LifeStart = 0;
		this.Lifetime = 5;
	}
	
	LifeIsOver(time)
	{
		return time - this.LifeStart > this.Lifetime;
	}
	
	/// 
	/// Invoked by the particle entity when it is relenquished to a pool.
	/// 
	OnSummonedFromPool()
	{
		//reset stuff here
		this.LifeStart = Time.time;
	}
}

