import Factory from './factory.js';
import Vector2 from './../core/vector2.js';
import AssetManager from './../core/assetmanager.js';

/// 
/// Provides an HTML-based editor tool for generating entities using the Factory singleton.
/// 
export class FactoryEditor
{
	#FactoryMethod;
	
	constructor(factoryMethod, camera)
	{
		this.#FactoryMethod = factoryMethod;
	}
	
	OnBeginDrag()
	{
	}
	
	OnEndDrag()
	{
	}
	
	/// 
	/// Draws the controls for this object when represented on the tool pallet.
	/// 
	DrawPalletUI()
	{
	}
	
	/// 
	/// Draws controls for the cusome inspector when this object is selected in the game world.
	/// 
	DrawInspectorUI()
	{
	}
}


/// 
/// 
/// 
export class Pallet
{
	#Factory;
	#Root;
	#Canvas;
	#Camera;
	#Enabled;
	#Div;
	#Selected;
	#Dragging;
	
	#Tools = [];
	#ToolDivs = [];
	
	
	constructor(rootDiv, canvas, factory, camera)
	{
		this.#Factory = factory;
		this.#Root = rootDiv;
		this.#Canvas = canvas;
		this.#Camera = camera;
		this.ToolWidgetWidth = 64;
		this.ToolWidgetHeight = 64;
	}
	
	get Factory() { return this.#Factory; }
	
	Enable()
	{
		if(this.#Enabled) return;
		this.#Enabled = true;
		
		this.#Div = document.createElement('div');
		this.#Root.appendChild(this.#Div);
		this.#Div.id = "EditorPallet"
		this.#Div.style = "background-color:#442244; padding:0px; padding-left:0px; padding-right:0px; color:white;";
		
		this.#Canvas.ondrop = this.OnToolDropped.bind(this);
		this.#Canvas.ondragover = this.OnValidateDrop.bind(this);
	}
	
	OnValidateDrop(evt)
	{
		evt.preventDefault();
	}
	
	OnToolDropped(evt)
	{
		//data transfer format is: [xoffset, yoffset, pallettool jason]
		let rawData = JSON.parse(evt.dataTransfer.getData("text"));
		let toolInfo = PalletTool.Generate(null, rawData[4]);
		let pos = new Vector2(evt.offsetX, evt.offsetY);
		pos = this.#Camera.ViewToWorld(pos);
		toolInfo.Params[0] = pos.x + rawData[0] - rawData[2];
		toolInfo.Params[1] = pos.y - rawData[1] + rawData[3];
		this.#Factory[toolInfo.FunctionName](...toolInfo.Params );
	}
	
	Disable()
	{
		if(!this.#Enabled) return;
		this.#Enabled = false;
		this.#Div.remove();
	}
	
	InstallTool(tool)
	{
		if(!(tool instanceof PalletTool))
			throw new Error("Object derived from PalletTool expected in editor.");
		
		let index = this.#Tools.indexOf(tool);
		if(index < 0)
		{
			this.#Tools.push(tool);
			let toolDiv = document.createElement('div');
			this.#ToolDivs.push(toolDiv);
			this.#Div.appendChild(toolDiv);
			
			toolDiv.draggable = true;
			toolDiv.style = "width:64px; height:64px; background-color:red; color:white; background-size:100%; 100%; background-image:url('" + tool.IconFile + "');";
			toolDiv.ondragstart = tool.OnDragStart.bind(tool);
			toolDiv.dragend = tool.OnDragEnd.bind(tool);
		}
	}
	
	UninstallTool(tool)
	{
		if(!(tool instanceof PalletTool))
			throw new Error("Object derived from PalletTool expected in editor.");
		
		let index = this.#Tools.indexOf(tool);
		if(index >= 0)
		{
			this.#Tools.splice(index, 1);
			this.#ToolDivs[index].remove();
			this.#ToolDivs.splice(index, 1);
		}
	}
	
	UninstallAllTools()
	{
		for(let tool of this.#Tools)
			this.UninstallTool(tool);
	}
	
	DrawPallet()
	{
		for(let tool of this.#Tools)
			tool.DrawTool(this);
	}
	
	DrawSelectedInspector()
	{
		if(this.Selected == null) return;
		
		//TODO: draw the inspector for the currently selected object.
	}
}


/// 
/// Represents a tool that is dispalyed on the tool pallet
/// along with all of the information needed to store, retreive,
/// and edit factory info used for object generation in the scene.
///
/// Parameters are stored as arrays with the format of ["TYPE", "DISPLAY NAME", Default Value]
/// 
export class PalletTool
{
	#AssetManager;
	
	constructor(assetManager, functionName, ...params)
	{
		this.FunctionName = functionName;
		this.Params = [0,0].concat(Array.from(params));
		this.AssetManager = assetManager;
	}
	
	set AssetManager(assetMan)
	{
		this.#AssetManager = assetMan;
		let outterThis = this;
		if(this.#AssetManager != null)
		{
			this.#AssetManager.LoadAsset(outterThis.IconFile).then(resolve =>
				{	outterThis.Icon = resolve;	});
		}
	}
	
	get IconFile()
	{
		return this.Params[this.Params.length-1];
	}
	
	Save()
	{
		return JSON.stringify(this);
	}
	
	Restore(assetManager, json)
	{
		let temp = JSON.parse(json);
		this.FunctionName = temp.FunctionName;
		this.Params = temp.Params;
		
		this.#AssetManager = assetManager;
		let outterThis = this;
		if(this.#AssetManager != null)
		{
			this.#AssetManager.LoadAsset(outterThis.IconFile).then(resolve =>
				{	outterThis.Icon = resolve;	});
		}
	}
	
	static Generate(assetManager, json)
	{
		let tool = new PalletTool(assetManager, "", []);
		tool.Restore(assetManager, json);
		return tool;
	}
	
	DrawTool(pallet)
	{
	}
	
	DrawInspector()
	{
	}
	
	OnDragStart(evt)
	{
		//the default icon will be the size of the image! That's not gonna work!
		//evt.dataTransfer.setDragImage(this.Icon, this.Icon.width/2, this.Icon.height/2);
		evt.dataTransfer.setData("text", JSON.stringify([this.Icon.width, this.Icon.height, evt.offsetX, evt.offsetY, this.Save()]));
	}
	
	OnDragEnd(evt)
	{
	}
}

