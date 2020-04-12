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
import FollowOnEvent from './../systems/FollowOnEvent.js';
import FollowEndOnEvent from './../systems/FollowEndOnEvent.js';


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
	
	static CreateCamera(spawnPosX, spawnPosY, renderScale)
	{
		let trans = new WorldPos();
		trans.position = new Vector2(spawnPosX, spawnPosY);
		let camera = new Camera(Factory.Canvas.width / renderScale, Factory.Canvas.height / renderScale);
		let followEvent = new FollowOnEvent();
		let followEnd = new FollowEndOnEvent();
		
		let ent = new Entity("Main Camera",
			trans,
			camera,
			new SmoothFollower(0.07, 0),
			followEvent,
			followEnd,
			);
		
		
		ent.DoNotUnload = true;
		Factory.EntityManager.RegisterEntity(ent);
		followEvent.EventName = "PlayerSpawn";
		followEnd.EventName = "PlayerDespawn";
		
		return ent;
	}
	
}

