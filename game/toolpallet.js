import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import Factory from './factory.js';
import Vector2 from './../core/vector2.js';
import AssetManager from './../core/assetmanager.js';
import * as Editor from './sceneeditor.js';
import Assets from './assettable.js';
import {ColorLog} from './../core/utility.js';


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
	#PalletDiv;
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
		
		this.#PalletDiv = document.createElement('div');
		this.#Root.appendChild(this.#PalletDiv);
		this.#PalletDiv.id = "ToolPallet"
		this.#PalletDiv.class = "ToolPallet";
		
		this.#Canvas.ondrop = this.OnToolDropped.bind(this);
		this.#Canvas.ondragover = this.OnValidateDrop.bind(this);
	}
	
	Disable()
	{
		if(!this.#Enabled) return;
		Editor.ForceSelection(null);
		this.#Enabled = false;
		this.#PalletDiv.remove();
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
		//setting the positional data. we are assuming the position is always the first element and is
		//represented as an object with the fields 'x' and 'y' (like a Vector2)
		toolInfo.Params[1] = new Vector2((pos.x + rawData[0] - rawData[2]),
										 (pos.y - rawData[1] + rawData[3]));
		toolInfo.Params[1] = Editor.SnapPosition(toolInfo.Params[1]);
		this.#Factory[toolInfo.FunctionName](...toolInfo.Params).then( (result) =>{
			Editor.ForceSelection(result);
		});
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
			this.#PalletDiv.appendChild(toolDiv);
			
			toolDiv.draggable = true;
			toolDiv.className = "ToolIcon";
			toolDiv.style = "background-image:url('" + tool.IconFile + "');";
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
		else console.log("Warning! Missing tool index.");
	}
	
	UninstallAllTools()
	{
		while(this.#Tools.length > 0)
			this.UninstallTool(this.#Tools[0]);
	}
	
	DrawPallet()
	{
		for(let tool of this.#Tools)
			tool.DrawTool(this);
	}
	
}


/// 
/// Represents a tool that is displayed on the tool pallet
/// along with all of the information needed to store, retreive,
/// and edit factory info used for object generation in the scene.
///
/// Parameters are stored as arrays with the format of ["TYPE", "DISPLAY NAME", Default Value]
/// 
export class PalletTool
{
	#AssetManager;
	
	constructor(assetManager, functionName, iconPath, ...params)
	{
		this.FunctionName = functionName;
		this.IconPath = iconPath;
		this.Params = Array.from(params);
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
		return this.IconPath;
	}
	
	Save()
	{
		return JSON.stringify(this);
	}
	
	Restore(assetManager, json)
	{
		let temp = JSON.parse(json);
		this.FunctionName = temp.FunctionName;
		this.IconPath = temp.IconPath;
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
		let tool = new PalletTool(assetManager, "", "", []);
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
		//evt.dataTransfer.setData("text", JSON.stringify([this.Icon.width, this.Icon.height, evt.offsetX, evt.offsetY, this.Save()]));
		//HACK ALERT: Hard coding the width adn height here ton ensure dran n drop positionings things correctly.
		evt.dataTransfer.setData("text", JSON.stringify([32, 32, evt.offsetX, evt.offsetY, this.Save()]));
	
	}
	
	OnDragEnd(evt)
	{
	}
}

