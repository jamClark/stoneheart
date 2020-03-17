import AssetManager from './../core/assetmanager.js';
import Assets from './../game/assettable.js';

import Entity from './../ecs/entity.js';
import Camera from './../systems/camera.js';
import WorldPos from './../systems/worldpos.js';
import SpriteRenderer from './../systems/spriterenderer.js';
import TiledSpriteRenderer from './../systems/tiledspriterenderer.js';
import SpriteAnimator from './../systems/spriteanimator.js';
import BoxCollider from './../systems/boxcollider.js';
import Rigidbody from './../systems/rigidbody.js';
import PlayerInputReader from './../systems/playerinputreader.js';
import CharacterController from './../systems/charactercontroller.js';
import SmoothFollower from './../systems/smoothfollower.js';
import ParticleEmitter from './../systems/particleemitter.js';
import SelectionBox from './../systems/selectionbox.js';

import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import {ShadowMember} from './../core/utility.js';


const ppx = 1; // 0.0158;

const Layers =
{
	Background: 0,
	TilesBG0: 1,
	TilesBG1: 2,
	Enemy: 10,
	PrePlayer: 19,
	Player: 20,
	PostPlayer: 30,
	TilesFG0: 40,
	TilesFG1: 41,
}

/// 
/// Class for creating fully-formed entities with appropriate components attached.
/// 
export default class Factory
{
	static Init(canvas, assetManager, entityMan, animatorSystem, editModeEnabled = true)
	{
		Factory.Canvas = canvas;
		Factory.AssetManager = assetManager;
		Factory.EntityManager = entityMan;
		Factory.EditMode = true;
		Factory.AnimatorSystem = animatorSystem;
	}
	
	/// 
	/// 
	/// 
	static async CreatePlayer(position)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let pos = new WorldPos(position);
		let ent = new Entity(
			"Player 1", 
			pos,
			new SpriteRenderer(await Factory.AssetManager.LoadAsset(Assets.Sprites.ANA_R), Layers.Player, 0, 44),
			new SpriteAnimator(await Factory.AssetManager.LoadAsset(Assets.Anims.ANA_R)),
			new Rigidbody(pos),
			new BoxCollider(Factory.CollisionSys, new Rect(0, 24, 20, 45)),
			new PlayerInputReader(),
			new CharacterController(
									await Factory.AssetManager.LoadAsset(Assets.Sounds.JUMP_1),
									await Factory.AssetManager.LoadAsset(Assets.Sounds.LAND_1),
									await Factory.AssetManager.LoadAsset(Assets.Sprites.ANA_L),
									await Factory.AssetManager.LoadAsset(Assets.Sprites.ANA_R),
									await Factory.AssetManager.LoadAsset(Assets.Anims.ANA_L),
									await Factory.AssetManager.LoadAsset(Assets.Anims.ANA_R)),
			new SelectionBox(),
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		Factory.PlayerInst = ent;
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "Player",
			name: "CreatePlayer",
			params: 
			[
				"WorldPosition-position",
			],
		}
		
		return ent;
	}
	
	static CreateCamera(spawnPosX, spawnPosY, renderScale)
	{
		let trans = new WorldPos(spawnPosX, spawnPosY);
		let ent = new Entity("Main Camera",
			trans,
			new Camera(Factory.Canvas, Factory.Canvas.width / renderScale, Factory.Canvas.height / renderScale, trans),
			new SmoothFollower(0.07, 0),
			);
		
		ent.DoNotUnload = true;
		return ent;
	}
	
	static async CreateWorldBlock(position, width, height, renderLayer, spritePath)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let trans = new WorldPos(position);
		let colliderRect = new Rect(0, 0, width, height);
		let col = new BoxCollider(Factory.CollisionSys, colliderRect, false, true);
		let renderer = new TiledSpriteRenderer(await this.AssetManager.LoadAsset(spritePath), 
										       colliderRect, renderLayer);
		
		let ent = new Entity("Block", trans, col, renderer, new SelectionBox());
		Factory.EntityManager.RegisterEntity(ent);
		
		//we are linking the tile renderer's width to the collider
		ShadowMember(col, 'Width', (value) => renderer.Rect.Width = value);
		ShadowMember(col, 'Height', (value) => renderer.Rect.Height = value);
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "World Block",
			name: "CreateWorldBlock",
			params: [
				"Entity-Active",
				"WorldPosition-position",
				"TiledSpriteRenderer-enabled",
				"TiledSpriteRenderer-Layer",
				"TiledSpriteRenderer-TextureOffset",
				"BoxCollider-enabled",
				"BoxCollider-Width",
				"BoxCollider-Height",
				"TiledSpriteRenderer-Sprite",
			],
		}
		
		return ent;	
	}
	
	static async CreateDecorativeTile(position, width, height, renderLayer, spritePath)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let trans = new WorldPos(position);
		let colliderRect = new Rect(0, 0, width, height);
		let box = new SelectionBox(width, height);
		let renderer = new TiledSpriteRenderer(await this.AssetManager.LoadAsset(spritePath), 
										       colliderRect, renderLayer);
		
		let ent = new Entity("Decorative Tile", trans, renderer, box);
		Factory.EntityManager.RegisterEntity(ent);
		
		//we are linking the tile renderer's width to the selection box
		ShadowMember(box, 'Width', (value) => renderer.Rect.Width = value);
		ShadowMember(box, 'Height', (value) => renderer.Rect.Height = value);
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "Decorative Tile",
			name: "CreateDecorativeTile",
			params: [
				"Entity-Active",
				"WorldPosition-position",
				"TiledSpriteRenderer-Layer",
				"TiledSpriteRenderer-TextureOffset",
				"SelectionBox-Width",
				"SelectionBox-Height",
				"TiledSpriteRenderer-Sprite",
			],
		}
		
		return ent;	
	}
	
	static async CreateParticleEmitter(position, renderLayer, spaceMode, spritePath, ...params)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let pos = new WorldPos(position);
		let partSys = new ParticleEmitter(renderLayer, Factory.AssetManager.LoadAsset(spritePath));
		partSys.SpaceMode = spaceMode;
		partSys.ApplyEmitConfiguration(...params);
		let ent = new Entity("Particle", 
			pos,
			partSys,
			new SelectionBox(),
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "Particle Emitter",
			name: "CreateParticleEmitter",
			params:[
				"Entity-Active",
				"WorldPosition-position",
				"ParticleEmitter-RenderEnabled",
				"ParticleEmitter-RenderLayer",
				"ParticleEmitter-SpriteAsset",
				"ParticleEmitter-Paused",
				"ParticleEmitter-Space",
				"ParticleEmitter-GravityScale",
				"ParticleEmitter-LoopTime",
				"ParticleEmitter-MaxParticles",
				"ParticleEmitter-EmitRate",
				"ParticleEmitter-MinLifetime",
				"ParticleEmitter-MaxLifetime",
				"ParticleEmitter-MinScale",
				"ParticleEmitter-MaxScale",
				"ParticleEmitter-MinPosX",
				"ParticleEmitter-MaxPosX",
				"ParticleEmitter-MinPosY",
				"ParticleEmitter-MaxPosY",
				"ParticleEmitter-MinStartVelX",
				"ParticleEmitter-MaxStartVelX",
				"ParticleEmitter-MinStartVelY",
				"ParticleEmitter-MaxStartVelY",
			],
		}
		return ent;
	}
	
	/// 
	/// Creates a simple entity that only has a spirte and has no collision or behavior.
	/// 
	static async CreateDecorativeEntity(position, renderLayer, spriteAsset)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let pos = new WorldPos(position);
		let sprite = new SpriteRenderer(await Factory.AssetManager.LoadAsset(spriteAsset), renderLayer, 0, 0);
		let ent = new Entity(
			"Decorative Entity", 
			pos,
			sprite,
			new SelectionBox(),
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "Decorative Entity",
			name: "CreateDecorativeEntity",
			params: 
			[
				"Entity-Active",
				"WorldPosition-position",
				"SpriteRenderer-Layer",
				"SpriteRenderer-Sprite",
			],
		}
		
		return ent;
	}
	
	/// 
	/// Creates a simple entity that can be animated and has no collision or behavior.
	/// 
	static async CreateDecorativeAnimatedEntity(position, renderLayer, animToPlay, animAsset, spriteAsset)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let pos = new WorldPos(position);
		let sprite = new SpriteRenderer(await Factory.AssetManager.LoadAsset(spriteAsset), renderLayer, 0, 0);
		let animator = new SpriteAnimator(await Factory.AssetManager.LoadAsset(animAsset));
		let ent = new Entity(
			"Decorative Entity (Animated)", 
			pos,
			sprite,
			animator,
			new SelectionBox(),
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		animator.PlayAnim(animToPlay);
		Factory.AnimatorSystem.Process(ent, animator, sprite);
		
		//needed for serialization
		ent._factoryInfo =
		{
			type: "Decorative Entity (Animated)",
			name: "CreateDecorativeAnimatedEntity",
			params: 
			[
				"Entity-Active",
				"WorldPosition-position",
				"SpriteRenderer-Layer",
				"SpriteRenderer-Sprite",
				"SpriteAnimator-AnimAsset",
			],
		}
		
		return ent;
	}
}

