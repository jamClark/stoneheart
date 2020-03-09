import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import Input from './../core/input.js';
import {LoadFileSync} from './../core/filereader.js';

import WorldPos from './../systems/worldpos.js';
import SelectionBox from './../systems/selectionbox.js';

import Factory from './../game/factory.js';
import {FactoryEditor, Pallet, PalletTool} from './../game/factoryeditor.js';


/// 
/// A variety of functions for live scene-editing.
/// 
let SelectionInc = 0;
let CurrentSelection = null;
let LastSelected = null;
let SelectionOffset = new Vector2();

let SelectedListeners = [];
let DeselectedListeners = [];

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

export function HandleSelection(entityMan, camera)
{
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
			trans.position = camera.ViewToWorld(Input.MousePosition.Add(SelectionOffset));
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
			}
			LastSelected = CurrentSelection;
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

export function RenderSelection(entityMan, camera)
{
	if(LastSelected == null)
		return;
	
	//TODO: draw a worldspace grid
	
	//draw hilighted selection box
	let worldRect = LastSelected.WorldRect;
	Debug.DrawRect(worldRect, "yellow");
}

export function DeserializePalletTools(assetMan, path)
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
					tools.push(CreateTool(assetMan, data.slice(1, data.length)));
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

export function CreateTool(assetMan, args)
{
	return new PalletTool(assetMan, ...args);
}

