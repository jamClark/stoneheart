//core
import {MainLoop} from './core/apploop.js';
import Time from './core/time.js';
import AppState from './core/appstate.js';
import AppStateMachine from './core/appstatemachine.js';
import DebugTools from './core/debugtools.js';
import AssetManager from './core/assetmanager.js';
import Entity from './ecs/entity.js';
import EntityManager from './ecs/entitymanager.js';
import SystemManager from './ecs/systemsmanager.js';
import Input from './core/input.js';
import RenderLayer from './core/renderlayer.js';

//game project imports
import Assets from './game/assettable.js';
import Factory from './game/factory.js';
import SceneManager from './game/scene.js';

//ecs components
import Camera from './systems/camera.js';

//ecs systems
import SpriteRendererSystem from './systems/spriterenderersystem.js';
import SpriteAnimatorSystem from './systems/spriteanimatorsystem.js';
import TiledSpriteRendererSystem from './systems/tiledspriterenderersystem.js';
import PhysicsSystem from './systems/physicssystem.js';
import CollisionSystem from './systems/collisionsystem.js';
import PlayerInputSystem from './systems/playerinputsystem.js';
import CharacterControllerSystem from './systems/charactercontrollersystem.js'
import SmoothFollowerSystem from './systems/smoothfollowersystem.js';
import ParticleSystemSystem from './systems/particlesystemsystem.js';

//components
import WorldPos from './systems/worldpos.js';
import SmoothFollower from './systems/smoothfollower.js';
import ParticleSystem from './systems/particlesystem.js';
import SpriteRenderer from './systems/spriterenderer.js';

let EntMan, SysMan, AssetMan, SceneMan, RenderLayers;
const RenderScale = 2;

/// 
/// Entry-point for the application.
/// 
export function AppStart(canvas)
{
	//globals
	EntMan = new EntityManager();
	SysMan = new SystemManager(EntMan);
	
	let canvasContext = canvas.getContext("2d");
	canvasContext.imageSmoothingEnabled = false;
	RenderLayers = new RenderLayer(canvas);
	AssetMan = new AssetManager(canvasContext);
	SceneMan = new SceneManager(AssetMan, EntMan, SysMan);
	
	Factory.Init(canvas, AssetMan, EntMan);
	let MainCamera = Factory.CreateCamera(RenderScale);
	window.Debug = new DebugTools(RenderLayers.RequestLayer(100), MainCamera.GetComponent(Camera), false); //yeah, it's a global. Sue me.
	
	
	let AnimSys = new SpriteAnimatorSystem();
	let RenderSys = new SpriteRendererSystem(RenderLayers, MainCamera.GetComponent(Camera));
	let TiledRenderSys = new TiledSpriteRendererSystem(RenderLayers, MainCamera.GetComponent(Camera));
	let PhysicsSys = new PhysicsSystem();
	let CollisionSys = new CollisionSystem();
	let AppFSM = new AppStateMachine();
	let PlayerInputSys = new PlayerInputSystem();
	let CharacterControllerSys = new CharacterControllerSystem();
	let SmoothFollowerSys = new SmoothFollowerSystem();
	let ParticleSystemSys = new ParticleSystemSystem(RenderSys);
	AppFSM.PushState(AppStateMachine.EmptyLoopState);
	Factory.CollisionSys = CollisionSys; //this is used internally when creating colliders but it doesn't exist at the time we call Init() above!!
	
	//register global systems
	Input.Init(window);
	EntMan.RegisterEntity(MainCamera);
	
	//register the systems that we will tick for each update/fixed update cycle
	SysMan.RegisterSystem(PlayerInputSys);
	SysMan.RegisterSystem(CharacterControllerSys);
	SysMan.RegisterFixedSystem(CharacterControllerSys);
	SysMan.RegisterFixedSystem(PhysicsSys);
	SysMan.RegisterFixedSystem(CollisionSys);
	SysMan.RegisterSystem(CollisionSys); //this is simply for debug rendering
	SysMan.RegisterSystem(SmoothFollowerSys);
	SysMan.RegisterSystem(AnimSys);
	SysMan.RegisterSystem(RenderSys);
	SysMan.RegisterSystem(TiledRenderSys);
	
	//define a 'normal update' state for the FSM. This is where the bulk of our ECS updates will be processed
	AppFSM.MainGameLoopState = new AppState(
		[
			() =>
			{
				//debugging and utility stuff
				if(Input.GetKeyDown("KeyP"))
					TogglePhysicsDebugDrawing();
				if(Input.GetKeyDown("KeyK"))
					console.log(SceneMan.SaveScene());
			},
			() => { RenderLayers.ClearLayers(); },
			() => Input.BeginInputBlock(),
			SysMan.Update.bind(SysMan),
			() => Time.ConsumeAccumulatedTime(SysMan.FixedUpdate.bind(SysMan)),
			() => Input.EndInputBlock(),
			() => RenderLayers.CompositeLayers(),
		],
	);
	AppFSM.LoadingState = new AppState([]); //TODO: Some kind of universal 'loading' system that ticks when loading
	
	
	//This jumpstarts the core loop by telling the browser
	//to call 'mainLoop' at the next update cycle.
	requestAnimationFrame(MainLoop);
	
	//helper for loading/refreshing scenes
	let loadLevel = async function(path) {
		
		AppFSM.PushState(AppFSM.LoadingState);
		SceneMan.UnloadCurrentScene();
		await SceneMan.LoadScene(path);
		MainCamera.GetComponent(SmoothFollower).SetTarget(Factory.PlayerInst.GetComponent(WorldPos));
		CollisionSys.RebuildSpacialTree();
		AppFSM.PopState();
	}
	
	//pre-load all assets we'll need, load the default scene, and then push the main looping state
	Assets.PreloadAllAssets(AssetMan).then( async () =>
	{
		await loadLevel('./assets/scene1.txt');
		let particleEnt = await CreateTestParticle(RenderLayers, MainCamera.GetComponent(Camera), 0, 0, './assets/sprites/poop.png');
		AppFSM.PushState(AppFSM.MainGameLoopState);
	});
	
}

let CreateTestParticle = async function(renderLayers, camera, spawnPosX, spawnPosY, imagePath)
{
	let pos = new WorldPos(spawnPosX, spawnPosY);
	let renderer = new SpriteRenderer(await Factory.AssetManager.LoadAsset(Assets.Table.SPRITE_ANA_R), Layers.Player, 0, 44)
	renderer.enabled = false; //this is to stop the default render system from trying to draw it.
	
	let ent = new Entity("Particle", pos,
		new ParticleSystem(),
		renderer,
		);
	
	EntityMan.RegisterEntity(ent);
	console.log("--------------> ent.name");
	return ent;
}

let TogglePhysicsDebugDrawing = function()
{
	window.Debug.DebugDraw = !window.Debug.DebugDraw;
}










