import Editor from './editor.js';
import EditorPanel from './editorpanel.js';
import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import AssetManager from './../core/assetmanager.js';
import * as Scene from './sceneeditor.js';
import Assets from './assettable.js';
import {ColorLog} from './../core/utility.js';


/// 
/// Inspector panel for viewing and modifying the components attached to a gameobject.
/// 
export default class InspectorEditor extends EditorPanel
{
	#Bindings = [];
	
	constructor(elementId, title, rootDiv, canvas, camera, assetManager)
	{
		super(elementId, title, rootDiv, canvas, camera, assetManager);
		this.ClearInspector();
	}
	
	Enable()
	{
		if(!super.Enable()) return false;
		
		Scene.AddSelectedListener(this, this.HandleSelection);
		Scene.AddDeselectedListener(this, this.HandleDeselection);
		return true;
	}
	
	Disable()
	{
		if(!super.Disable()) return false;
		
		this.ClearInspector();
		Scene.RemoveSelectedListener(this.HandleSelection);
		Scene.RemoveDeselectedListener(this.HandleDeselection);
		return true;
	}
	
	HandleSelection(selectionBox)
	{
		this.DrawInspector(this.PanelDiv, selectionBox.Entity);
	}
	
	HandleDeselection(selectionBox)
	{
		this.ClearInspector();
	}
	
	ClearInspector()
	{
		while(this.PanelDiv.children.length > 0)
			this.PanelDiv.removeChild(this.PanelDiv.children[0]);
		
		for(let binding of this.#Bindings)
			RemoveMemberShadow(binding[0], binding[1]);
		
		this.#Bindings = [];
	}
	
	DrawInspector(parentDiv, ent)
	{
		if(ent == null)
			throw new Error("Null object passed to DrawInspector.");
		
		//Editor.DrawHeader(parentDiv, ent.name);
		Editor.DrawStringField(parentDiv, ent, "name", "Name");
		let components = ent.Components;
		for(let comp of components)
			this.DrawComponent(parentDiv, ent, comp);
	}
	
	DrawComponent(parentDiv, ent, comp)
	{
		let type = comp.GetType();
		if(type.IsBlacklistedInspectorObject)
			return;
		let props = type.SerializationList;
		let insp = type.InspectorProps;
		
		
		if(props.length != insp.length)
		{
			ColorLog("There was an error in defining the inspector and serialization properties of the component type '"+comp.type+"'. There were " + props.length + " properties and " + insp.length + " inspector entries.", "warning");
			return;
		}
		
		let componentDiv = document.createElement('div');
		Editor.DrawHeader(componentDiv, comp.type);
		for(let i = 0; i < props.length; i++)
			this.DrawProperty(componentDiv, comp, props[i], insp[i][0], insp[i][1]);
		
		componentDiv.className = "ComponentPanel";
		parentDiv.appendChild(componentDiv);
	}
	
	DrawProperty(parentDiv, comp, propName, typeName, label)
	{
		let type = comp.GetType();
		if(type.IsBlacklistedInspectorProperty(propName))
			return;
		
		//let temp = type.GetInspectorOverrideForProperty(propName);
		//if(temp != null) propName = temp;
		
		switch(typeName)
		{
			case "bool":
			{
				this.#Bindings.push(Editor.DrawBoolField(parentDiv, comp, propName, label)); 
				break;
			}
			case "float":
			{
				this.#Bindings.push(Editor.DrawFloatField(parentDiv, comp, propName, label));
				break;
			}
			case "int":
			{
				this.#Bindings.push(Editor.DrawIntField(parentDiv, comp, propName, label));
				break;
			}
			case "string":
			{
				this.#Bindings.push(Editor.DrawStringField(parentDiv, comp, propName, label)); 
				break;
			}
			case "enum":
			{
				//let's see if we've defined an enum for this type
				let enums = Scene.GetEnumDefs();
				let enumSet = enums.get(label);
				if(enumSet != null)
					this.#Bindings.push(Editor.DrawEnumDropdown(parentDiv, comp, propName, label, enumSet));
				else ColorLog("Missing enum '" + label + "'.", "warning");
				break;
			}
			case "vector2":
			{
				this.#Bindings.push(Editor.DrawVector2Field(parentDiv, comp, propName, label));
				break;
			}
			default:
			{
				let assetType = typeName.split(".");
				if(assetType.length > 1 && assetType[0] == 'Assets')
				{
					//we want to display a list of asset strings in a dropdown
					let assetSet = Object.values(Assets.GetAssetsOfType(assetType[1]));
					if(assetSet != null)
						this.#Bindings.push(Editor.DrawAssetDropdown(parentDiv, comp, propName, label, assetSet, this.AssetMan, 150));
					break;
				}
				
				ColorLog("Unknown datatype for "+comp.type+"."+propName+". Inspector control cannot be displayed.", "warning");
				break;
			}
		}
	}
	
}
