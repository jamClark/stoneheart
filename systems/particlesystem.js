import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import CollisionSystem from './collisionsystem.js'
import Particle from './particle.js';


/// 
/// An entity component that manages its own internal system for handling the spawning,
/// lifetime, motion, and rendering of particles.
/// 
export default class ParticleSystem extends BaseComponentSystem
{
	constructor()
	{
		super(WorldPos, SpriteRenderer, Particle);
		this.Space = SpaceMode.Local;
		
		if(ParticleSystem.Systems == null) ParticleSystem.Systems = [];
		
	}
	
	OnEnable()
	{
		ParticleSystem.Systems.push(this);
	}
	
	OnDisable()
	{
		let index = ParticleSystem.Systems.indexOf(this);
		if(index >= 0)
			ParticleSystem.Systems.splice(index, 1);
	}
	
	/// 
	/// This will be invoked by the ParticleSystemSystem each update tick.
	/// 
	Update(entity, worldPos, particleSystem)
	{
		console.log("HI");
	}
	
	/// 
	/// 
	/// 
	Process(ent, worldPos, renderer, particle)
	{
		//TODO: Update the position of each particle based on particle velocities/spacemode/positions
	}
}


const SpaceMode = 
{
	World : 1,
	Local : 2,
}