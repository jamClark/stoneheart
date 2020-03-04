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

//game project imports
import Assets from './game/assettable.js';
import Factory from './game/factory.js';
import {FactoryEditor, Pallet, PalletTool} from './game/factoryeditor.js';
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
import ParticleEmitterSystem from './systems/particleemittersystem.js';

//components
import WorldPos from './systems/worldpos.js';
import SmoothFollower from './systems/smoothfollower.js';
import SpriteRenderer from './systems/spriterenderer.js';
import {SpaceMode} from './systems/particleemitter.js';

let EntMan, SysMan, EditorSysMan, AssetMan, SceneMan, RenderLayers, ToolPallet, AppFSM;
let LoadedTools;
const RenderScale = 2;
const AllowLiveSceneEditing = true;

/// 
/// Entry-point for the application.
/// 
export function AppStart(canvas)
{
	//globals
	EntMan = new EntityManager();
	SysMan = new SystemManager(EntMan);
	EditorSysMan = new SystemManager(EntMan);
	
	let canvasContext = canvas.getContext("2d");
	canvasContext.imageSmoothingEnabled = false;
	RenderLayers = new RenderLayer(canvas);
	AssetMan = new AssetManager(canvasContext);
	SceneMan = new SceneManager(AssetMan, EntMan, SysMan);
	
	LoadedTools = DeserializePalletTools('./assets/pallettools.txt');
	Factory.Init(canvas, AssetMan, EntMan);
	let MainCamera = Factory.CreateCamera(0, 0, RenderScale);
	window.Debug = new DebugTools(RenderLayers.RequestLayer(100), MainCamera.GetComponent(Camera), false); //yeah, it's a global. Sue me.
	ToolPallet = new Pallet(document.getElementById("RootContainer"), canvas, Factory, MainCamera.GetComponent(Camera));
	
	
	//create and register global systems
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
	
	EditorSysMan.RegisterSystem(CollisionSys); //this is simply for debug rendering
	EditorSysMan.RegisterSystem(RenderSys);
	EditorSysMan.RegisterSystem(TiledRenderSys);
	EditorSysMan.RegisterSystem(ParticleEmitterSys);
	
	
	//define a 'normal update' state for the FSM. This is where the bulk of our ECS updates will be processed
	AppFSM.MainGameLoopState = new AppState(
		[
			() => { RenderLayers.ClearLayers(); },
			() => Input.BeginInputBlock(),
			() =>
			{
				//debugging and utility stuff
				if(Input.GetKeyDown("KeyL"))
					TogglePhysicsDebugDrawing();
				if(AllowLiveSceneEditing && Input.GetKeyDown("KeyP"))
					EnableToolPallet();
			},
			SysMan.Update.bind(SysMan),
			() => Time.ConsumeAccumulatedTime(SysMan.FixedUpdate.bind(SysMan)),
			() => Input.EndInputBlock(),
			() => RenderLayers.CompositeLayers(),
		]
	);
	AppFSM.LoadingState = new AppState([]); //TODO: Some kind of universal 'loading' system that ticks when loading
	AppFSM.SceneEditorState = new AppState(
		[
		() => { RenderLayers.ClearLayers(); },
		() => Input.BeginInputBlock(),
		() =>
		{
			if(Input.GetKeyDown("KeyL"))
				TogglePhysicsDebugDrawing();
			if(Input.GetKeyDown("KeyK"))
				console.log(SceneMan.SaveScene());
			if(AllowLiveSceneEditing && Input.GetKeyDown("KeyP"))
				DisableToolPallet(CollisionSys);
		},
		() => HandleSelection(CollisionSys, MainCamera.GetComponent(Camera)),
		EditorSysMan.Update.bind(EditorSysMan),
		() => Time.ConsumeAccumulatedTime(EditorSysMan.FixedUpdate.bind(EditorSysMan)),
		() => Input.EndInputBlock(),
		() => RenderLayers.CompositeLayers(),
		() => RenderSelection(),
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
		//let particleEnt = await Factory.CreateParticleEmitter(100, 0, RenderLayers, SpaceMode.World, './assets/sprites/alert.png',
		//	1, 5, 1000, 7, 1, 2);
		AppFSM.PushState(AppFSM.MainGameLoopState);
	});
	
}

let SelectionInc = 0;
let CurrentSelection = null;
function HandleSelection(collisionSys, camera)
{
	if(Input.GetMouse(0))
	{
		let pos = camera.ViewToWorld(Input.MousePosition);
		//console.log("POS: " + pos.x);
		let cols = collisionSys.GetAllColliders(pos);
		if(cols.length > 0)
		{
			console.log("We found " + cols.length + " motha fuckas!");
		}
		else
		{
			//console.log("Nada");
		}
		//console.log("Hello?");
	}
}

function RenderSelection()
{
	if(CurrentSelection == null)
		return;
	
	//first, draw a worldspace grid
	
	//now draw a highlight for the currently selected object, if any
}

function TogglePhysicsDebugDrawing()
{
	window.Debug.DebugDraw = !window.Debug.DebugDraw;
}

function DeserializePalletTools(path)
{
	let tools = [];
	let lines = LoadFileSync(path).split('\n');
	for(let line of lines)
	{
		line = line.trim();
		if(line != null && line.length > 0 && !line.startsWith('//'))
		{
			let data = JSON.parse(line);
			if(!Array.isArray(data))
				throw new Error("Invalid formatting for tool definition file.");
			switch(data[0])
			{
				case "TOOL":
				{
					tools.push(CreateTool(data.slice(1, data.length)));
					break;
				}
				case "ENUM":
				{
					console.log("ENUM definitions not currently supported. Skipping.");
					break;
				}
				case "INSPECTOR":
				{
					console.log("INSPECTOR definitions not currently supported. Skipping.");
					break;
				}
				default:
				{
					throw new Error("Unknow definition type: " + data[0]);
				}
			}
		}
	}
	
	return tools;
}

function CreateTool(args)
{
	return new PalletTool(AssetMan, ...args);
}

function EnableToolPallet()
{
	window.Debug.DebugDraw = true;
	AppFSM.PushState(AppFSM.SceneEditorState);
	ToolPallet.Enable();
	for(let tool of LoadedTools)
		ToolPallet.InstallTool(tool);
}

function DisableToolPallet(collisionSystem)
{
	window.Debug.DebugDraw = false;
	AppFSM.PopState();
	ToolPallet.Disable();
	ToolPallet.UninstallAllTools();
	collisionSystem.RebuildSpacialTree();
}
