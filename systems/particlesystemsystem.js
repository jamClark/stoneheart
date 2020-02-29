import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';
import ParticleSystem from './particlesystem.js';
import Time from './../core/time.js';

/// 
/// A system for updating all active particle systems in the scene.
/// 
export default class ParticleSystemSystem extends BaseComponentSystem
{
	//an external SpriteRenderSystem that this will piggy-back onto for rendering sprites.
	#Renderer;
	
	constructor(spriteRenderSystem, ppm = 1)
	{
		super(WorldPos, ParticleSystem);
		this.#Renderer = spriteRenderSystem;
		this.Gravity = new Vector2(0, -20 * (1/Time.fixedDeltaTime));
		this.PixelsPerMeter = ppm;
	}
	
	get RenderSystem() { return this.#Renderer; }
	
	Process(entity, pos, particleSystem)
	{
		particleSystem.Update(this, entity, pos, particleSystem, this.#Renderer); 
	}
	
	ApplyGravity(gravityScale, particle)
	{
		if(gravityScale > 0)
		{
			let inc = this.Gravity.Mul(gravityScale * Time.fixedDeltaTime);
			particle.Velocity.Sum(inc.Mul(this.PixelsPerMeter));
		}
	}
}



