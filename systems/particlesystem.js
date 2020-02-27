import BaseComponent from './../ecs/basecomponent.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import CollisionSystem from './collisionsystem.js'
import Lazarus from './../core/pool.js';
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
	#Paused = false;
	
	constructor(poolId, localPos, renderSys, renderLayer, spriteAsset)
	{
		super(WorldPos, SpriteRenderer, Particle);
		if(ParticleSystem.Systems == null) ParticleSystem.Systems = [];
		this.LocalPos = localPos;
		spriteAsset.then(result => { this.SpriteAsset = result; });
		this.#RenderSystem = renderSys;
		this.#PoolId = poolId;
		
		if(!Lazarus.IsDefined(poolId))
			Lazarus.Define(poolId, 5, 1000, ParticleSystem.GenerateParticle, this);
		
		//system configuration
		this.Space = SpaceMode.World;
		this.StartingVel = new Vector2(0, 100);
		this.RenderLayer = renderLayer;
		this.GravityScale = 1;
		this.LoopTime = 5;
		this.MaxParticles = 1000;
		this.EmitRate = 1; //particles per second
		
		this.MinLifetime = 0;
		this.MaxLifetime = 4;
		this.MinPosX = 0;
		this.MaxPosX = 0;
		this.MinPosY = 0;
		this.MaxPosY = 0;
		this.MinStartVelX = -200;
		this.MaxStartVelX = 200;
		this.MinStartVelY = 500;
		this.MaxStartVelY = 500;
		
		//There has GOT to be a better way of iterating over
		//a specific set of fields in an object!
		this.ConfigSequence = function* ()
		{
			this.GravityScale = yield 0;
			this.LoopTime = yield 0;
			this.MaxParticles = yield 0;
			this.EmitRate = yield 0;
			this.MinLifetime = yield 0;
			this.MaxLifetime = yield 0;
			this.MinPosX = yield 0;
			this.MaxPosX = yield 0;
			this.MinPosY = yield 0;
			this.MaxPosY = yield 0;
			this.MinStartVelX = yield 0;
			this.MaxStartVelX = yield 0;
			this.MinStartVelY = yield 0;
			this.MaxStartVelY = yield 1;
			return 1;
		}
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
	/// Increments down the list of parans and applies them to
	/// this particle system's configurable emittance options.
	/// 
	ApplyEmitConfiguration(...params)
	{
		let s = Array.from(arguments);
		
		//HACK ALERT: Not ensuring that we don't overflow our generator!
		let seq = this.ConfigSequence();
		seq.next();
		for(let i = 0; i < s.length; i++)
			seq.next(s[i]);
	}
	
	Pause()
	{
		this.#Paused = true;
	}
	
	Play()
	{
		this.#Paused = false;
	}
	
	/// 
	/// 
	/// 
	Emit(pos)
	{
		//do not attempt to emit if we have not finished loading the sprite asset
		if(this.SpriteAsset == null)
			return;
		
		let ent = Lazarus.Summon(this.#PoolId);
		
		//reset state
		let systemTrans = this.Entity.GetComponent(WorldPos);
		let trans = ent.GetComponent(WorldPos);
		let particle = ent.GetComponent(Particle);
		
		particle.Velocity = new Vector2(
									(Math.random() * (this.MaxStartVelX - this.MinStartVelX)) + this.MinStartVelX,
									(Math.random() * (this.MaxStartVelY - this.MinStartVelY)) + this.MinStartVelY);
		particle.Lifetime = (Math.random() * (this.MaxLifetime - this.MinLifetime)) + this.MinLifetime;
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
	Process(masterSystem, ent, worldPos, renderer, particle, renderSystem)
	{
		if(!this.#Paused)
		{
			worldPos.position = worldPos.position.Add(particle.Velocity.Mul(Time.deltaTime));
			masterSystem.ApplyGravity(this.GravityScale, particle);
		}
		
		renderSystem.Process(ent, renderer, worldPos);
	}
	
	/// 
	/// This will be invoked by the ParticleSystemSystem each update tick.
	/// 
	Update(masterSystem, entity, worldPos, particleSystem, rendererSystem)
	{
		//emit if needed
		if(!this.#Paused && 
			this.EmitRate > 0 && 
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
			if(!this.#Paused && part.LifeIsOver(Time.time))
				temp.push(part);
			else this.Process(
						masterSystem,
						part.Entity, 
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
}


const SpaceMode = 
{
	World : 1,
	Local : 2,
}