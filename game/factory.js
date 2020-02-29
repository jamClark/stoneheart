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
import ParticleSystem from './../systems/particlesystem.js';


import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';



const ppx = 1; // 0.0158;

const Layers =
{
	Background: -1,
	TilesBG0: 0,
	TilesBG1: 1,
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
	static Init(canvas, assetManager, entityMan)
	{
		Factory.Canvas = canvas;
		Factory.AssetManager = assetManager;
		Factory.EntityManager = entityMan;
	}
	
	static async CreateParticleSystem(spawnPosX, spawnPosY, renderLayer, spaceMode, spritePath, ...params)
	{
		let pos = new WorldPos(spawnPosX, spawnPosY);
		let partSys = new ParticleSystem(spritePath, renderLayer, Factory.AssetManager.LoadAsset(spritePath));
		partSys.SpaceMode = spaceMode;
		partSys.ApplyEmitConfiguration(...params);
		
		let ent = new Entity("Particle", 
			pos,
			partSys,
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		return ent;
	}
	
	/// 
	/// 
	/// 
	static async CreatePlayer(spawnPosX = 0, spawnPosY = 0)
	{
		let pos = new WorldPos(spawnPosX, spawnPosY);
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
									await Factory.AssetManager.LoadAsset(Assets.Anims.ANA_R))
			);
		
		Factory.EntityManager.RegisterEntity(ent);
		Factory.PlayerInst = ent;
		
		//needed for serialization
		ent._factoryInfo =
		{
			name: "CreateWorldBlock",
			params: Array.from(arguments),
		}
		
		return ent;
	}
	
	static CreateCamera(renderScale)
	{
		let trans = new WorldPos(0, 0);
		let ent = new Entity("Main Camera",
			trans,
			new Camera(Factory.Canvas, Factory.Canvas.width / renderScale, Factory.Canvas.height / renderScale, trans),
			new SmoothFollower(0.07, 0),
			);
		
		ent.DoNotUnload = true;
		return ent;
	}
	
	static async CreateWorldBlock(xPos, yPos, width, height, renderLayer, spritePath)
	{
		let colliderRect = new Rect(0, 0, width, height);
		let trans = new WorldPos(xPos, yPos);
		let col = new BoxCollider(Factory.CollisionSys, colliderRect, false, true);
		let renderer = new TiledSpriteRenderer(await this.AssetManager.LoadAsset(spritePath), 
										       colliderRect, renderLayer);
		
		let ent = new Entity("Block", trans, col, renderer);
		Factory.EntityManager.RegisterEntity(ent);
		
		//needed for serialization
		ent._factoryInfo =
		{
			name: "CreateWorldBlock",
			params: Array.from(arguments),
		}
		
		return ent;	
	}
}

