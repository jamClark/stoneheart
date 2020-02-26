import BaseComponent from './../ecs/basecomponent.js';

/// 
/// State information for a single particle of a particle system.
/// 
export default class Particle extends BaseComponent
{
	constructor()
	{
		super();
		this.Scale = new Vector2(1, 1);
		this.Velocity = new Vector2(0, 0);
	}
}

