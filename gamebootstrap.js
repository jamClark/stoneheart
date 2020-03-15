//core
import {MainLoop} from './core/apploop.js';
import Time from './core/time.js';
import AppState from './core/appstate.js';
import AppStateMachine from './core/appstatemachine.js';
import DebugTools from './core/debugtools.js';
import AssetManager from './core/assetmanager.js';
import {LoadFileSync} from './core/filereader.js';
import Entity from './ecs/entity.js';
import EntityManager from './ecs/entitymanager.js';
import SystemManager from './ecs/systemsmanager.js';
import Input from './core/input.js';
import RenderLayer from './core/renderlayer.js';
import Vector2 from './core/vector2.js';
import Rect from './core/rect.js';

//game project imports
import Assets from './game/assettable.js';
import Factory from './game/factory.js';
import {Pallet, Inspector, PalletTool} from './game/factoryeditor.js';
import SceneManager from './game/scene.js';
import * as Editor from './game/sceneeditor.js';

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
import ParticleEmitterSystem from './systems/particleemittersystem.js';

//components
import WorldPos from './systems/worldpos.js';
import SmoothFollower from './systems/smoothfollower.js';
import SpriteRenderer from './systems/spriterenderer.js';
import {SpaceMode} from './systems/particleemitter.js';
import SelectionBox from './systems/selectionbox.js';


let EntMan, SysMan, EditorSysMan, AssetMan, SceneMan, RenderLayers, ToolPallet, InspectorPallet, AppFSM;
let LoadedTools;
const RenderScale = 2;
const AllowLiveSceneEditing = true;

/// 
/// Entry-point for the application.
/// 
export function AppStart(canvas)
{
	//global initialization
	EntMan = new EntityManager();
	SysMan = new SystemManager(EntMan);
	EditorSysMan = new SystemManager(EntMan);
	
	let canvasContext = canvas.getContext("2d");
	canvasContext.imageSmoothingEnabled = false;
	RenderLayers = new RenderLayer(canvas);
	AssetMan = new AssetManager(canvasContext);
	SceneMan = new SceneManager(AssetMan, EntMan, SysMan);
	
	LoadedTools = Editor.DeserializePalletTools(AssetMan, './assets/pallettools.txt');
	Factory.Init(canvas, AssetMan, EntMan);
	let MainCamera = Factory.CreateCamera(0, 0, RenderScale);
	window.Debug = new DebugTools(RenderLayers.RequestLayer(100), MainCamera.GetComponent(Camera), false); //yeah, it's a global. Sue me.
	ToolPallet = new Pallet(document.getElementById("RootContainer"), canvas, Factory, MainCamera.GetComponent(Camera));
	InspectorPallet = new Inspector(document.getElementById("RootContainer"), canvas, Factory, MainCamera.GetComponent(Camera));
	
	//create and register global systems
	//TODO: We need a more automated way of doing this... if only javascript had simple RTTI :(
	let AnimSys = new SpriteAnimatorSystem();
	let RenderSys = new SpriteRendererSystem(RenderLayers, MainCamera.GetComponent(Camera));
	let TiledRenderSys = new TiledSpriteRendererSystem(RenderLayers, MainCamera.GetComponent(Camera));
	let PhysicsSys = new PhysicsSystem();
	let CollisionSys = new CollisionSystem();
	let PlayerInputSys = new PlayerInputSystem();
	let CharacterControllerSys = new CharacterControllerSystem();
	let SmoothFollowerSys = new SmoothFollowerSystem();
	let ParticleEmitterSys = new ParticleEmitterSystem(RenderSys);
	
	
	AppFSM = new AppStateMachine();
	AppFSM.PushState(AppStateMachine.EmptyLoopState);
	Factory.CollisionSys = CollisionSys; //this is used internally when creating colliders but it doesn't exist at the time we call Init() above!!
	Input.Init(window, canvas);
	EntMan.RegisterEntity(MainCamera);
	
	//register the systems that we will tick for each update/fixed update cycle
	//Runtime Systems.
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
	SysMan.RegisterSystem(ParticleEmitterSys);
	
	//Pause Systems.
	//PasuedSysMan.RegisterSystem(RenderSys);
	//PausedSysMan.RegisterSystem(TiledRenderSys);
	
	//Editor-Only Systems.
	EditorSysMan.RegisterSystem(CollisionSys); //this is simply for debug rendering
	EditorSysMan.RegisterSystem(RenderSys);
	EditorSysMan.RegisterSystem(TiledRenderSys);
	EditorSysMan.RegisterSystem(ParticleEmitterSys);
	
	
	//define a 'normal update' state for the FSM. This is where the bulk of our ECS updates will be processed
	AppFSM.MainGameLoopState = new AppState(
		[
			() => { 
				EntMan.RemoveDestroyedEntities();
				RenderLayers.ClearLayers();
				Input.BeginInputBlock();

				//debugging and utility stuff
				if(Input.GetKeyDown("KeyL"))
					TogglePhysicsDebugDrawing();
				if(AllowLiveSceneEditing && Input.GetKeyDown("KeyP"))
					EnableEditMode(MainCamera.GetComponent(Camera));				
				},
			SysMan.Update.bind(SysMan),
			() => {
				Time.ConsumeAccumulatedTime(SysMan.FixedUpdate.bind(SysMan));
				Input.EndInputBlock();
				RenderLayers.CompositeLayers();
			},
		]
	);
	AppFSM.LoadingState = new AppState([]); //TODO: Some kind of universal 'loading' system that ticks when loading
	AppFSM.SceneEditorState = new AppState(
		[
		() => { 
			EntMan.RemoveDestroyedEntities();
			RenderLayers.ClearLayers();
			Input.BeginInputBlock();
			
			if(Input.GetKeyDown("KeyL"))
				TogglePhysicsDebugDrawing();
			if(Input.GetKeyDown("KeyK"))
				console.log(SceneMan.SaveScene());
			if(AllowLiveSceneEditing && Input.GetKeyDown("KeyP"))
				DisableEditMode(CollisionSys);
			
			Editor.HandleSelection(EntMan, MainCamera.GetComponent(Camera));
			},
		EditorSysMan.Update.bind(EditorSysMan),
		() => {
			Time.ConsumeAccumulatedTime(EditorSysMan.FixedUpdate.bind(EditorSysMan));
			Input.EndInputBlock();
			Editor.RenderSelection(EntMan, MainCamera.GetComponent(Camera));
			RenderLayers.CompositeLayers();
			},
		]
	);
	
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
		AppFSM.PushState(AppFSM.MainGameLoopState);
	});
	
}

function TogglePhysicsDebugDrawing()
{
	window.Debug.DebugDraw = !window.Debug.DebugDraw;
}

let EditorCamera;
function MoveCamera(evt)
{
	if(Input.GetMouse(1) || Input.GetMouse(2))
	{
		let trans = EditorCamera.Entity.GetComponent(WorldPos);
		trans.position = trans.position.Add(new Vector2(-evt.movementX, evt.movementY));
	}
}

function EnableEditMode(camera)
{
	EditorCamera = camera;
	document.addEventListener('mousemove', MoveCamera);
	window.Debug.DebugDraw = true;
	AppFSM.PushState(AppFSM.SceneEditorState);
	ToolPallet.Enable();
	InspectorPallet.Enable();
	for(let tool of LoadedTools)
		ToolPallet.InstallTool(tool);
	
}

function DisableEditMode(collisionSystem)
{
	EditorCamera = null;
	window.Debug.DebugDraw = false;
	document.removeEventListener('mousemove', MoveCamera);
	AppFSM.PopState();
	ToolPallet.Disable();
	InspectorPallet.Disable();
	ToolPallet.UninstallAllTools();
	collisionSystem.RebuildSpacialTree();
}
