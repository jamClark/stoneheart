import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';
import ParticleSystem from './particlesystem.js';


/// 
/// A system for updating all active particle systems in the scene.
/// 
export default class ParticleSystemSystem extends BaseComponentSystem
{
	//an external SpriteRenderSystem that this will piggy-back onto for rendering sprites.
	#Renderer;
	
	constructor(spriteRenderSystem)
	{
		super(WorldPos, ParticleSystem);
		this.#Renderer = spriteRenderSystem;
	}
	
	Process(entity, pos, particleSystem)
	{
		particleSystem.Update(entity, pos, particleSystem); 
	}
}



