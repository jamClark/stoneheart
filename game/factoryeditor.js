import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import Factory from './factory.js';
import Vector2 from './../core/vector2.js';
import AssetManager from './../core/assetmanager.js';
import * as Editor from './sceneeditor.js';

/// 
/// Provides an HTML-based editor tool for generating entities using the Factory singleton.
///
/// TODO: We need to remove the binding to properties when we disable an inspector!!
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
export class Inspector
{
	#Factory;
	#Root;
	#Canvas;
	#Camera;
	#Enabled;
	
	#InspectorDiv;
	#Bindings = [];
	
	constructor(rootDiv, canvas, factory, camera)
	{
		this.#Factory = factory;
		this.#Root = rootDiv;
		this.#Canvas = canvas;
		this.#Camera = camera;
	}
	
	get Factory() { return this.#Factory; }
	
	Enable()
	{
		if(this.#Enabled) return;
		this.#Enabled = true;
		
		let canvasDiv = document.getElementById("CanvasArea");
		canvasDiv.style="position:relative; left:-100px";
		this.#InspectorDiv = document.createElement('div');
		canvasDiv.appendChild(this.#InspectorDiv);
		this.#InspectorDiv.id = "Inspector"
		this.#InspectorDiv.class = "Inspector";
		
		Editor.AddSelectedListener(this, this.HandleSelection);
		Editor.AddDeselectedListener(this, this.HandleDeselection);
	}
	
	Disable()
	{
		if(!this.#Enabled) return;
		
		let canvasDiv = document.getElementById("CanvasArea");
		canvasDiv.style="left=0px";
		this.#Enabled = false;
		this.#InspectorDiv.remove();
		this.ClearInspector();
		
		Editor.RemoveSelectedListener(this.HandleSelection);
		Editor.RemoveDeselectedListener(this.HandleDeselection);
	}
	
	#Inputs = [];
	DrawInspector(obj)
	{
		if(obj == null)
			throw new Error("Null object passed to DrawInspector.");
		
		this.DrawHeader(this.#InspectorDiv, obj, obj.Entity._factoryInfo.type);
		let def = this.GetInspectorDef(obj);
		this.DrawInputs(def, this.#InspectorDiv, obj);
	}
	
	ClearInspector()
	{
		for(let input of this.#Inputs)
			input.remove();
		
		for(let binding of this.#Bindings)
			RemoveMemberShadow(binding[0], binding[1]);
		
		this.#Bindings = [];
		this.#Inputs = [];
	}
	
	/// 
	/// Specific binding helper for handling complext HTML element that represents a Vector2.
	/// 
	BindVector2(xElm, yElm, eventName, elementValue, obj, property)
	{
		xElm[eventName] = () => obj[property] = new Vector2(parseFloat(xElm[elementValue]), obj[property].y);
		yElm[eventName] = () => obj[property] = new Vector2(obj[property].x, parseFloat(yElm[elementValue]));
		
		ShadowMember(obj, property, (value) =>
		{ 
			xElm[elementValue] = value.x; 
			yElm[elementValue] = value.y;
		});
		this.#Bindings.push([obj, property]);
	}
	
	/// 
	/// 
	/// 
	PassThroughConverter(value)
	{
		return value;
	}
	
	/// 
	/// Sets up a two-way binding between the obj's property and an HTML element value.
	/// Two optiomal converter functions may be passed to perform data conversion between
	/// the linked HTML element and it's bound backing property. If one converter supplied,
	/// both should be supplied. By default, no conversion takes place.
	/// 
	Bind(element, eventName, elementValue, obj, property, elmToPropConverter = this.PassThroughConverter, propToElmConverter = this.PassThroughConverter)
	{
		element[eventName] = () => obj[property] = elmToPropConverter(element[elementValue]);
		ShadowMember(obj, property, (value) => { element[elementValue] = propToElmConverter(value); });
		this.#Bindings.push([obj, property]);
	}
	
	/// 
	/// 
	/// 
	GetInspectorDef(obj)
	{
		for(let def of Editor.GetInspectorDefs())
		{
			if(def.FunctionName == obj.Entity._factoryInfo.name)
				return def;
		}
		
		return null;
	}
	
	/// 
	/// 
	/// 
	DrawInputs(inspectorDef, parentDiv, obj)
	{
		if(inspectorDef == null)
			throw new Error(`Missing inspector definition for factory ${obj.Entity._factoryInfo.name}.`);
		
		//for(let params of inspectorDef.Fields)
		for(let i = 0; i < inspectorDef.Fields.length; i++)
		{
			let param = inspectorDef.Fields[i];
			switch(param[0])
			{
				case "float":
				{
					let prop = obj.Entity._factoryInfo.params[i];
					this.DrawFloatField(parentDiv, obj, prop, param[1]);
					break;
				}
				case "vector2":
				{
					let prop = obj.Entity._factoryInfo.params[i];
					this.DrawVector2Field(parentDiv, obj, prop, param[1]);
					break;
				}
				default:
				{
					//let's see if we've defined an enum for this type
					let enums = Editor.GetEnumDefs();
					let enumSet = enums.get(param[0]);
					if(enumSet != null)
					{
						let prop = obj.Entity._factoryInfo.params[i];
						this.DrawEnumDropdown(parentDiv, obj, prop, param[0], enumSet);
					}
				}
			}
		}
		
	}
		
	/// 
	/// 
	/// 
	DrawEnumDropdown(parentDiv, obj, property, label, enumSet)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.style = "display:inline-block; white-space:nowrap; margin:8px;";
		
		titleElm.innerHTML = `${label}:`;
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = "width:100px;"
		for(let e of enumSet)
		{
			let option = document.createElement('option');
			option.innerHTML = e[0];
			option.value = e[1];
			inputElm.appendChild(option);
		}
		
		let propObj = obj.Entity.GetProperty(property);
		let index = enumSet.map(x => x[1]).indexOf(propObj);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		let propPath = property.split("-");
		let comp = obj.Entity.GetComponent(propPath[0]);
		let bindSrc = SearchPropertyContainer(comp, propPath[1]);
		this.Bind(inputElm, "oninput", "selectedIndex", bindSrc[0], bindSrc[1], 
				(value) => 
				{
					//ELEMENT-TO-PROP
					return enumSet[value][1];
				},
				(value) =>
				{
					//PROP-TO-ELEMENT
					let index = enumSet.map(x => x[1]).indexOf(value);
					return index > -1 ? index : 0;
				});
		this.#Inputs.push(inputDiv);
	}
	
	/// 
	/// 
	/// 
	DrawHeader(parentDiv, obj, text)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `<b>${text}</b>`;
		titleElm.style = "margin:8px; font-size: 1.2rem; padding-bottom: 5px; display:block;";
		parentDiv.appendChild(titleElm);
		this.#Inputs.push(titleElm);
	}
	
	/// 
	/// 
	/// 
	DrawVector2Field(parentDiv, obj, property, label)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let xElm = document.createElement('input');
		let yElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(xElm);
		inputDiv.appendChild(yElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.style = "display:inline-block; white-space:nowrap; margin:8px;";
		
		titleElm.innerHTML = `${label}:`;
		titleElm.style = "padding-right: 5px";
		
		xElm.type = "number";
		xElm.value = obj.Entity.GetProperty(property).x;
		xElm.style = "width:50px; margin-right: 5px"
		xElm.name = `${property}.x`;
		
		yElm.type = "number";
		yElm.value = obj.Entity.GetProperty(property).y;
		yElm.style = "width:50px;"
		yElm.name = `${property}.x`;
		
		let propPath = property.split("-");
		let comp = obj.Entity.GetComponent(propPath[0]);
		let bindSrc = SearchPropertyContainer(comp, propPath[1]);
		this.BindVector2(xElm, yElm, "oninput", "value", bindSrc[0], bindSrc[1]);
		this.#Inputs.push(inputDiv);
	}
	
	/// 
	/// 
	/// 
	DrawFloatField(parentDiv, obj, property, label)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.style = "display:inline-block; white-space:nowrap; margin:8px;";
		
		titleElm.innerHTML = `${label}:`;
		titleElm.style = "padding-right: 5px";
		
		inputElm.type = "number";
		inputElm.value = obj.Entity.GetProperty(property);
		inputElm.style = "width:100px;"
		
		let propPath = property.split("-");
		let comp = obj.Entity.GetComponent(propPath[0]);
		let bindSrc = SearchPropertyContainer(comp, propPath[1]);
		this.Bind(inputElm, "oninput", "value", bindSrc[0], bindSrc[1]);
		this.#Inputs.push(inputDiv);
	}
	
	HandleSelection(obj)
	{
		this.DrawInspector(obj);
	}
	
	HandleDeselection(obj)
	{
		this.ClearInspector();
	}
}



/// 
/// 
/// 
export class InspectorDefinition
{
	#AssetManager;
	
	constructor(assetManager, functionName, ...params)
	{
		this.#AssetManager = assetManager;
		this.FunctionName = functionName[1];
		this.Fields = Array.from(params);
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
		//NOTE: Something has changed due to using vectors instead of positions in the factory so now 
		//we have to divide by two when positioning!
		toolInfo.Params[0] = new Vector2((pos.x + rawData[0] - rawData[2])/2,
										 (pos.y - rawData[1] + rawData[3])/2);
		
		this.#Factory[toolInfo.FunctionName](...toolInfo.Params );
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
	
	constructor(assetManager, functionName, ...params)
	{
		this.FunctionName = functionName;
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

