import BaseComponent from './../ecs/basecomponent.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import CollisionSystem from './collisionsystem.js'
import Lazarus from './../core/pool.js'; //HACK ALERT! Yikes! We are making potential cross dependencies here!!!
import Time from './../core/time.js';
import Entity from './../ecs/entity.js';
import WorldPos from './worldpos.js';
import SpriteRenderer from './spriterenderer.js';
import Particle from './particle.js';


/// 
/// An entity component that manages its own internal system for handling the spawning,
/// lifetime, motion, and rendering of particles.
/// 
export default class ParticleSystem extends BaseComponent
{
	#ActiveParticles = [];
	#RenderSystem;
	#PoolId;
	#LastEmitTime = -1000;
	
	constructor(poolId, localPos, renderSys, renderLayer, spriteAsset)
	{
		super(WorldPos, SpriteRenderer, Particle);
		
		if(ParticleSystem.Systems == null) ParticleSystem.Systems = [];
		
		this.LocalPos = localPos == null ? new Vector2() : localPos;
		this.Space = SpaceMode.World;
		this.StartingVel = new Vector2(0, 1);
		this.StartingLifeTime = 4;
		this.RenderLayer = renderLayer;
		spriteAsset.then(result => { this.SpriteAsset = result; });
		
		this.LoopTime = 5;
		this.MaxParticles = 10;
		this.EmitRate = 1; //particles per second
		this.#RenderSystem = renderSys;
		this.#PoolId = poolId;
		//TODO: We can't allow ourselves to redefine the same poolid!! that will throw and error!
		Lazarus.Define(poolId, 5, this.MaxParticles*5, ParticleSystem.GenerateParticle, this);
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
		
		//TODO: kill all particles here
		for(let part of this.#ActiveParticles)
			Lazarus.Relenquish(part.Entity);
		this.#ActiveParticles = [];
	}
	
	/// 
	/// This will be invoked by the ParticleSystemSystem each update tick.
	/// 
	Update(entity, worldPos, particleSystem, rendererSystem)
	{
		//emit if needed
		if(this.EmitRate > 0 && 
		   Time.time - this.#LastEmitTime > 1/this.EmitRate &&
		   this.#ActiveParticles.length < this.MaxParticles)
		{
			this.#LastEmitTime = Time.time;
			this.Emit();
		}
		
		//update all live particles
		let temp = [];
		for(let part of this.#ActiveParticles)
		{
			if(part.LifeIsOver(Time.time))
				temp.push(part);
			else this.Process(part.Entity, 
						 part.Entity.GetComponent(WorldPos), 
						 part.Entity.GetComponent(SpriteRenderer),
						 part,
						 this.#RenderSystem);
		}
		
		//iterate through removal list and, uh, make it so
		for(let part of temp)
		{
			let i = this.#ActiveParticles.indexOf(part);
			this.#ActiveParticles.splice(i, 1);
			Lazarus.Relenquish(part.Entity);
		}
	}
	
	/// 
	/// 
	/// 
	Emit(pos)
	{
		//do not attempt to emit if we have not finished loading the sprite asset
		if(this.SpriteAsset == null)
			return;
		
		let particle = Lazarus.Summon(this.#PoolId).GetComponent(Particle);
		
		//reset state
		let systemTrans = this.Entity.GetComponent(WorldPos);
		let trans = particle.Entity.GetComponent(WorldPos);
		trans.position = systemTrans.position;
		
		this.#ActiveParticles.push(particle);
	}
	
	/// 
	/// Helper function for creating a single particle.
	/// 
	static GenerateParticle(system)
	{
		let worldPos = new WorldPos();
		let rend = new SpriteRenderer(system.SpriteAsset, system.RenderLayer, 0, 0);
		let part = new Particle();
		
		part.Velocity = new Vector2(system.StartingVel);
		part.Life = system.StartingLife;
		
		if(system.Space == SpaceMode.Local)
			pos.SetParent(system.Entity.GetComponent(WorldPos));
		
		//let animator = new SpriteRenderer(spriteAnim);
		let ent = new Entity(
			"particle",
			worldPos,
			rend,
			part,
		);
		
		ent.OnSummonedFromPool = function()
		{
			part.OnSummonedFromPool();
		}
		
		return ent;
	}
	
	/// 
	/// Here is where we internally process each individual particle entity. This functions
	/// just like a normal ComponentSystem.Process() function but will only be iterated
	/// for particles the are owned by this ParticleSystem.
	/// 
	Process(ent, worldPos, renderer, particle, renderSystem)
	{
		//TODO: Update the position of each particle based on particle velocities/spacemode/positions
		worldPos.position = worldPos.position.Add(particle.Velocity.Mul(Time.deltaTime));
		
		renderSystem.Process(ent, renderer, worldPos);
	}
}


const SpaceMode = 
{
	World : 1,
	Local : 2,
}