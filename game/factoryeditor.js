import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import Factory from './factory.js';
import Vector2 from './../core/vector2.js';
import AssetManager from './../core/assetmanager.js';
import * as Editor from './sceneeditor.js';
import Assets from './assettable.js';


/// 
/// HACK ALERT: DrawAssetDropdown accesses images directly without the use of promises so it 
///				is essential that all images that will be displayed in the dropdown list are
///				loaded ahead of time.
/// 
export class Inspector
{
	#Factory;
	#Root;
	#Canvas;
	#Camera;
	#Enabled;
	
	#AssetManager;
	#AltDiv;
	#InspectorDiv;
	#Bindings = [];
	
	constructor(rootDiv, canvas, factory, camera, assetManager)
	{
		this.#Factory = factory;
		this.#Root = rootDiv;
		this.#Canvas = canvas;
		this.#Camera = camera;
		this.#AssetManager = assetManager;
		
		this.#InspectorDiv = document.createElement('div');
		this.#InspectorDiv.id = "Inspector"
		this.#InspectorDiv.class = "Inspector";
		
		//snap settings UI
		this.#AltDiv = document.createElement('div');
		this.#AltDiv.id = "AlternatePanel";
		this.DrawHeader(this.#AltDiv, "Snap Settings");
		this.DrawFloatField(this.#AltDiv, Editor.GetSnapSettings(), "x", "Snap X", 50);
		this.DrawFloatField(this.#AltDiv, Editor.GetSnapSettings(), "y", "Snap Y", 50);
	}
	
	get Factory() { return this.#Factory; }
	
	Enable()
	{
		if(this.#Enabled) return;
		this.#Enabled = true;
		
		let canvasDiv = document.getElementById("CanvasArea");
		canvasDiv.style="position:relative; left:-100px";
		
		this.#Root.appendChild(this.#InspectorDiv);
		this.#Root.appendChild(this.#AltDiv);
		
		Editor.AddSelectedListener(this, this.HandleSelection);
		Editor.AddDeselectedListener(this, this.HandleDeselection);
	}
	
	Disable()
	{
		if(!this.#Enabled) return;
		this.#Enabled = false;
		this.ClearInspector();
		
		let canvasDiv = document.getElementById("CanvasArea");
		canvasDiv.style="left=0px";
		
		this.#Root.removeChild(this.#InspectorDiv);
		this.#Root.removeChild(this.#AltDiv);
		
		Editor.RemoveSelectedListener(this.HandleSelection);
		Editor.RemoveDeselectedListener(this.HandleDeselection);
	}
	
	HandleSelection(obj)
	{
		this.DrawInspector(obj);
	}
	
	HandleDeselection(obj)
	{
		this.ClearInspector();
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
	/// Default binding converter. Simply returns the input value unchanged.
	/// 
	PassThroughConverter(value)
	{
		return value;
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
	
	DrawInspector(obj)
	{
		if(obj == null)
			throw new Error("Null object passed to DrawInspector.");
		
		this.DrawHeader(this.#InspectorDiv, obj.Entity._factoryInfo.type);
		let def = this.GetInspectorDef(obj);
		this.DrawInputs(def, this.#InspectorDiv, obj);
		
	}
	
	ClearInspector()
	{
		while(this.#InspectorDiv.children.length > 0)
			this.#InspectorDiv.removeChild(this.#InspectorDiv.children[0]);
		
		for(let binding of this.#Bindings)
			RemoveMemberShadow(binding[0], binding[1]);
		
		this.#Bindings = [];
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
			let prop = obj.Entity._factoryInfo.params[i];
			let fieldName = param[1];
			let bindSrc = this.GetBindingSet(obj, prop);
			
			switch(param[0])
			{
				case "float":
				{
					this.DrawFloatField(parentDiv, bindSrc[0], bindSrc[1], fieldName);
					break;
				}
				case "vector2":
				{
					this.DrawVector2Field(parentDiv, bindSrc[0], bindSrc[1], fieldName);
					break;
				}
				case "enum":
				{
					//let's see if we've defined an enum for this type
					let enums = Editor.GetEnumDefs();
					let enumSet = enums.get(fieldName);
					if(enumSet != null)
						this.DrawEnumDropdown(parentDiv, bindSrc[0], bindSrc[1], fieldName, enumSet);
					break;
				}
				case "bool":
				{
					this.DrawBoolField(parentDiv, bindSrc[0], bindSrc[1], fieldName);
					break;
				}
				default:
				{
					let s = param[0].split(".");
					if(s.length > 1 && s[0] == 'Assets')
					{
						//we want to display a list of asset strings in a dropdown
						let assetSet = Object.values(Assets.GetAssetsOfType(s[1]));
						if(assetSet != null)
							this.DrawAssetDropdown(parentDiv, bindSrc[0], bindSrc[1], fieldName, assetSet, 150);
					}
					break;
				}
			}
		}
		
	}
	
	/// 
	/// 
	/// 
	DrawBoolField(parentDiv, obj, property, label)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.type = "checkbox";
		inputElm.value = obj[property];
		
		this.Bind(inputElm, "oninput", "checked", obj, property);
	}
	
	/// 
	/// 
	/// 
	DrawFloatField(parentDiv, obj, property, label, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		inputElm.inputmode = "numeric";
		inputElm.value = obj[property];
		
		this.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// 
	/// 
	DrawAssetDropdown(parentDiv, obj, property, label, list, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		for(let e of list)
		{
			let option = document.createElement('option');
			option.innerHTML = e;
			option.value = e;
			inputElm.appendChild(option);
		}
		
		let actualValue = obj[property];
		let index = list.indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		this.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					//HACK ALERT: We can't load resources here! They *must* already exist in the AssetManager for this to work!!
					//ELEMENT-TO-PROP
					return this.#AssetManager.GetDirectResource(list[value]);
				},
				(value) =>
				{
					let index = list.indexOf(value.srcPath);
					return index > -1 ? index : 0;
				});
	}
	
	/// 
	/// 
	/// 
	DrawListDropdown(parentDiv, obj, property, label, list, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		for(let e of list)
		{
			let option = document.createElement('option');
			option.innerHTML = e;
			option.value = e;
			inputElm.appendChild(option);
		}
		
		let actualValue = obj[property];
		console.log("ACTUAL: " + actualValue);
		let index = list.indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		this.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					//ELEMENT-TO-PROP
					return list[value];
				},
				(value) =>
				{
					//PROP-TO-ELEMENT
					let index = list.indexOf(value);
					return index > -1 ? index : 0;
				});
	}
		
	/// 
	/// 
	/// 
	DrawEnumDropdown(parentDiv, obj, property, label, enumSet, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		for(let e of enumSet)
		{
			let option = document.createElement('option');
			option.innerHTML = e[0];
			option.value = e[1];
			inputElm.appendChild(option);
		}
		
		let index = enumSet.map(x => x[1]).indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		this.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
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
	}
	
	/// 
	/// 
	/// 
	DrawHeader(parentDiv, text)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `<b>${text}</b>`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "margin:8px; font-size: 1.2rem; padding-bottom: 5px; display:block;";
		parentDiv.appendChild(titleElm);
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
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(xElm);
		inputDiv.appendChild(yElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		xElm.inputmode = "numeric";
		xElm.value = obj[property].x;
		xElm.style = "width:50px; margin-right: 5px"
		xElm.name = `${property}.x`;
		
		yElm.inputmode = "numeric";
		yElm.value = obj[property].y;
		yElm.style = "width:50px;"
		yElm.name = `${property}.x`;
		
		this.BindVector2(xElm, yElm, "onchange", "value", obj, property);
	}
	
	/// 
	/// Helper for getting the object and it's property within an Entity-component structure.
	/// 
	GetBindingSet(obj, property)
	{
		let propPath = property.split("-");
		if(propPath[0] == 'Entity')
		{
			//TODO: We aren't decomposing dot paths within the Entity itself!
			//What if we wan't something like 'Entity-SomeVector.x'? We'll be fucked.
			return [obj.Entity, propPath[1]];
		}
		else
		{
			let comp = obj.Entity.GetComponent(propPath[0]);
			return SearchPropertyContainer(comp, propPath[1]);
		}
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

