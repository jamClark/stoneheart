import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import Input from './../core/input.js';
import {LoadFileSync} from './../core/filereader.js';

import WorldPos from './../systems/worldpos.js';
import SelectionBox from './../systems/selectionbox.js';
import BoxCollider from './../systems/boxcollider.js';
import Factory from './../game/factory.js';
import {Pallet, PalletTool, Inspector, InspectorDefinition} from './../game/factoryeditor.js';


/// 
/// A variety of functions for live scene-editing.
/// 
let SelectionInc = 0;
let CurrentSelection = null;
let LastSelected = null;
let SelectionOffset = new Vector2();
let RegisteredEnums = new Map();
let RegisteredInspectors = [];
let SelectedListeners = [];
let DeselectedListeners = [];
let SnapSettings = {
	x: 32,
	y: 32,
};

export function GetInspectorDefs() { return RegisteredInspectors; }
export function GetEnumDefs() { return RegisteredEnums; }
export function GetSnapSettings() { return SnapSettings }

export function AddSelectedListener(obj, handler)
{
	SelectedListeners.push([obj, handler]);
}

export function RemoveSelectedListener(handler)
{
	for(let i = 0; i < SelectedListeners.length; i++)
	{
		if(SelectedListeners[i][1] === handler)
		{
			SelectedListeners.splice(i, 1);
			return;
		}
	}
}

export function AddDeselectedListener(obj, handler)
{
	DeselectedListeners.push([obj, handler]);
}

export function RemoveDeselectedListener(handler)
{
	for(let i = 0; i < DeselectedListeners.length; i++)
	{
		if(DeselectedListeners[i][1] === handler)
		{
			DeselectedListeners.splice(i, 1);
			return;
		}
	}
}

function InvokeOnSelectedListeners()
{
	for(let list of SelectedListeners)
		list[1].call(list[0], CurrentSelection);
}

function InvokeOnDeselectedListeners()
{
	for(let list of DeselectedListeners)
		list[1].call(list[0], CurrentSelection);
}

export function GetSelectionAtMouse(entityMan, camera)
{
	let list = [];
	let pos = camera.ViewToWorld(Input.MousePosition);
	let cols = entityMan.QueryForEntities(SelectionBox).map( x => x.GetComponent(SelectionBox));
	for(let col of cols)
	{
		let trans = col.Entity.GetComponent(WorldPos);
		if(col.WorldRect.IsOverlapping(pos))
			list.push(col);
	}
	return list;
}

/// 
/// 
/// 
export function SnapPosition(pos)
{
	return new Vector2(Math.round(pos.x / SnapSettings.x) * SnapSettings.x, Math.round(pos.y / SnapSettings.y) * SnapSettings.y);
}

/// 
/// 
/// 
export function HandleSelection(entityMan, camera)
{
	if(document.activeElement.tagName == 'BODY' && LastSelected != null && (Input.GetKeyDown("Backspace") || Input.GetKeyDown("Delete")) )
	{
		LastSelected.Entity.Destroy();
		this.ForceSelection(null);
		return;
	}
	
	if(CurrentSelection != null)
	{
		if(Input.GetMouseUp(0) || Input.GetMouseDown(0))
		{
			//drop
			CurrentSelection = null;
		}
		else
		{
			//drag
			let trans = CurrentSelection.Entity.GetComponent(WorldPos);
			trans.position = SnapPosition(camera.ViewToWorld(Input.MousePosition.Add(SelectionOffset)));
		}
	}
	if(Input.GetMouseDown(0))
	{
		let list = GetSelectionAtMouse(entityMan, camera);
		if(list.length > 0)
		{
			//selectand begin dragging
			if(SelectionInc >= list.length)
				SelectionInc = 0;
			CurrentSelection = list[SelectionInc];
			if(CurrentSelection !== LastSelected)
			{
				if(LastSelected != null)
					InvokeOnDeselectedListeners();
				InvokeOnSelectedListeners();
				LastSelected = CurrentSelection;
			}
			
			let trans = CurrentSelection.Entity.GetComponent(WorldPos);
			SelectionOffset = camera.WorldToView(trans.position).Sub(Input.MousePosition);
			SelectionInc++;
		}
		else
		{
			if(LastSelected != null)
				InvokeOnDeselectedListeners();
			SelectionInc = 0;
			CurrentSelection = null;
			LastSelected = null;
		}
	}
	//TODO: Selection logic here using MouseUp instead of MouseDown
}

/// 
/// 
/// 
export function ForceSelection(entity)
{
	if(entity == null)
	{
		if(LastSelected != null)
			InvokeOnDeselectedListeners();
		SelectionInc = 0;
		CurrentSelection = null;
		LastSelected = null;
		return;
	}
	else
	{
		let box = entity.GetComponent(SelectionBox);
		if(box != null)
		{
			CurrentSelection = box;
			if(CurrentSelection !== LastSelected)
			{
				if(LastSelected != null)
					InvokeOnDeselectedListeners();
				InvokeOnSelectedListeners();
			}
			LastSelected = CurrentSelection;
			SelectionInc = 0;
			CurrentSelection = null;// this stops us from dragging
		}
	}
}

export function RenderSelection(entityMan, camera)
{
	//TODO: draw a worldspace grid
	
	//draw anything with a SelectionBox and no BoxCollider attached to it
	let ents = entityMan.QueryForEntities(SelectionBox);
	ents = entityMan.FilterEntities(ents, BoxCollider);
	for(let box of ents.map(x => x.GetComponent(SelectionBox)))
		Debug.DrawRect(box.WorldRect, "blue");
	
	let cols = entityMan.QueryForEntities(BoxCollider).map(x => x.GetComponent(BoxCollider));
	for(let col of cols)
	{
		if(!col.Entity.Active || !col.Enabled)
			Debug.DrawRect(col.WorldRect(col.Entity.GetComponent(WorldPos).position), "grey");
	}
	
	if(LastSelected == null)
		return;
	
	//draw hilighted selection box
	let worldRect = LastSelected.WorldRect;
	Debug.DrawRect(worldRect, "yellow");
	
}

export function DeserializePalletTools(assetMan, path)
{
	let tools = [];
	let inspectors = [];
	let enums = [];
	
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
					let temp = CreateTool(assetMan, data.slice(1, data.length));
					if(temp != null) tools.push(temp);
					break;
				}
				case "ENUM":
				{
					let temp = CreateEnum(RegisteredEnums, data.slice(1, data.length));
					break;
				}
				case "INSPECTOR":
				{
					let temp = CreateInspectorDef(assetMan, data.slice(1, data.length));
					if(temp != null) inspectors.push(temp); 
					else console.log("INSPECTOR definition was invalid. Skipping.");
					break;
				}
				default:
				{
					throw new Error("Unknown definition type: " + data[0]);
				}
			}
		}
	}
	
	
	//HACK ALERT: Side effects galore!
	RegisteredInspectors = inspectors;
	return tools;
}

export function CreateEnum(enumMap, args)
{
	enumMap.set(args[0], args.splice(1,args.length-1));
}

export function CreateInspectorDef(assetMan, args)
{
	return new InspectorDefinition(assetMan, ...args);
}

export function CreateTool(assetMan, args)
{
	return new PalletTool(assetMan, ...args);
}

