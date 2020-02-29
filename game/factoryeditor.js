import Factory from './factory.js';


/// 
/// Provides an HTML-based editor tool for generating entities using the Factory singleton.
/// 
export class FactoryEditor
{
	#FactoryMethod;
	
	
	constructor(factoryMethod)
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
	#Enabled;
	#Div;
	#Selected;
	
	#Tools = [];
	#ToolDivs = [];
	
	
	constructor(rootDiv, canvas, factory)
	{
		this.#Factory = factory;
		this.#Root = rootDiv;
		this.#Canvas = canvas;
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
		this.#Div.style = "background-color:black; padding:10px; padding-left:20px; padding-right:20px; color:white;";
		
		this.#Canvas.ondrop = this.OnToolDropped;
		this.#Canvas.ondragover = this.OnValidateDrop;;
	}
	
	OnValidateDrop(evt)
	{
		evt.preventDefault();
	}
	
	OnToolDropped(evt)
	{
		console.log("A tool was dropped into the root div!");
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
			let div = document.createElement('div');
			this.#ToolDivs.push(div);
			this.#Div.appendChild(div);
			
			div.draggable = true;
			div.style = "width:64px; height:64px; background-color:grey; color:white";
			div.ondragstart = tool.OnDragStart;
			div.dragend = tool.OnDragEnd;
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
export class PalletTool
{
	constructor(functionName, ...params)
	{
		this.FunctionName = functionName;
		this.Params = [];//Array.from(...params);
	}
	
	Save()
	{
		return JSON.stringify(this);
	}
	
	Restore(json)
	{
		let temp = JSON.parse(json);
		this.FunctionName = temp.FunctionName;
		this.Params = temp.Params;
	}
	
	DrawTool(pallet)
	{
	}
	
	DrawInspector()
	{
	}
	
	OnDragStart(evt)
	{
	}
	
	OnDragEnd(evt)
	{
	}
}

