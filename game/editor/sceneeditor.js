import Vector2 from './../../core/vector2.js';
import Rect from './../../core/rect.js';
import Input from './../../core/input.js';
import {LoadFileSync} from './../../core/filereader.js';
import Time from './../../core/time.js';

import WorldPos from './../../systems/worldpos.js';
import SelectionBox from './../../systems/selectionbox.js';
import BoxCollider from './../../systems/boxcollider.js';
import Factory from './../factory.js';
import Inspector from './inspector.js';
import {Pallet, PalletTool} from './toolpallet.js';


/// 
/// A variety of functions for live scene-editing.
/// 
let HasDragged = false;
let SelectionInc = 0;
let DragSelection = null;
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
export function CurrentlySelectedEntity() { return LastSelected ? LastSelected.Entity : null; }

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
		list[1].call(list[0], DragSelection);
}

function InvokeOnDeselectedListeners()
{
	for(let list of DeselectedListeners)
		list[1].call(list[0], DragSelection);
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

let InitialSelect = false;
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
	
	if(DragSelection != null)
	{
		let trans = DragSelection.Entity.GetComponent(WorldPos);
		if(!HasDragged)
			HasDragged = trans.position.Sub(BeginDragPos).Mag > 1;
		
		if(Input.GetMouseUp(0) || Input.GetMouseDown(0))
		{
			if(!InitialSelect && !HasDragged)
			{
				if(CheckSelection(entityMan, camera) == LastSelected)
					SelectionInc++;
				DoSelection(entityMan, camera);
			}
			InitialSelect = false;
			
			//drop
			DragSelection = null;
			HasDragged = false;
		}
		else
		{
			//drag
			let trans = DragSelection.Entity.GetComponent(WorldPos);
			trans.position = SnapPosition(camera.ViewToWorld(Input.MousePosition.Add(SelectionOffset)));
		}
	}
	else
	{
		if(Input.GetMouseDown(0))
		{
			let newSelection = CheckSelection(entityMan, camera);
			if(newSelection != LastSelected)
				InitialSelect = true;
			DoSelection(entityMan, camera);
		}
	}
}

let BeginDragPos;
/// 
/// 
/// 
function DoSelection(entityMan, camera)
{
	let list = GetSelectionAtMouse(entityMan, camera);
	if(list.length < 1)
	{
		//clicked an empty location, deselect last
		ForceSelection(null);
		return null;
	}
	
	//select and begin dragging operation
	if(SelectionInc >= list.length)
		SelectionInc = 0;
	DragSelection = list[SelectionInc];
	if(DragSelection !== LastSelected)
	{
		if(LastSelected != null)
			InvokeOnDeselectedListeners();
		InvokeOnSelectedListeners();
		LastSelected = DragSelection;
	}
	
	let trans = DragSelection.Entity.GetComponent(WorldPos);
	SelectionOffset = camera.WorldToView(trans.position).Sub(Input.MousePosition);
	BeginDragPos = trans.position;
	return LastSelected;
}

/// 
/// Checks what the next entity, if any, will be selected given the current state.
/// 
function CheckSelection(entityMan, camera)
{
	let list = GetSelectionAtMouse(entityMan, camera);
	if(list < 1) return null;
	
	let inc = SelectionInc;
	if(inc >= list.length)
		inc = 0;
	return list[inc];
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
		DragSelection = null;
		LastSelected = null;
		return;
	}
	else
	{
		let box = entity.GetComponent(SelectionBox);
		if(box != null)
		{
			DragSelection = box;
			if(DragSelection !== LastSelected)
			{
				if(LastSelected != null)
					InvokeOnDeselectedListeners();
				InvokeOnSelectedListeners();
			}
			LastSelected = DragSelection;
			SelectionInc = 0;
			DragSelection = null;// this stops us from dragging
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
				case "BITMASK":
				{
					let temp = CreateEnum(RegisteredEnums, data.slice(1, data.length));
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

export function CreateTool(assetMan, args)
{
	return new PalletTool(assetMan, ...args);
}

