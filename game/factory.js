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
	static Init(canvas, assetManager, entityMan)
	{
		Factory.Canvas = canvas;
		Factory.AssetManager = assetManager;
		Factory.EntityManager = entityMan;
	}
	
	static async CreateParticleEmitter(position, renderLayer, spaceMode, spritePath, ...params)
	{
		position = new Vector2(position);//this is because we may have just fed in a json deserialized object.
		let pos = new WorldPos(spawnPosX, spawnPosY);
		let partSys = new ParticleEmitter(spritePath, renderLayer, Factory.AssetManager.LoadAsset(spritePath));
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
			params: Array.from(arguments),
		}
		return ent;
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
		let colliderRect = new Rect(position.x, position.y, width, height);
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
				"WorldPosition-position",
				"BoxCollider-Width",
				"BoxCollider-Height",
				"TiledSpriteRenderer-Layer",
				"TiledSpriteRenderer-Sprite",
				],
		}
		
		return ent;	
	}
}

