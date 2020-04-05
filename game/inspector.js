import Editor from './editor.js';
import EditorPanel from './editorpanel.js';
import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import AssetManager from './../core/assetmanager.js';
import * as Scene from './sceneeditor.js';
import Assets from './assettable.js';
import {ColorLog} from './../core/utility.js';
import TypedObject from './../core/type.js';


const DropDownMenuID = "ComponentDropdownMenu";
const DropDownListID = "ComponentDropDownList";
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
		
		this.RegisterMenuCloser(this.HideComponentDropDown.bind(this));
		let body = document.getElementById('ContextMenus');
		body.innerHTML = body.innerHTML + `
		<div class="ContextMenu" id="${DropDownMenuID}">
			<ul id="${DropDownListID}" class="ContextMenuList" >
			</ul>
		</div>
		`;
	}
	
	AddComponentToEnt(evt)
	{
		this.CloseContextMenus();
		let ent = Scene.CurrentlySelectedEntity();
		if(ent != null)
		{
			let comp = TypedObject.Activate(evt.target.innerHTML);
			if(comp == null)
			{
				alert("The component type '"+evt.target.innerHTML+"' has not been defined.");
				return;
			}
			try
			{
				ent.AddComponent(comp);
			}
			catch(e) 
			{
				alert(e);
				console.log(e);
			}
			
			this.ClearInspector();
			this.DrawInspector(this.PanelDiv, ent);
		}
		
	}
	
	DisplayComponentDropDown(evt)
	{
		this.CloseContextMenus();
		let menu = document.getElementById(DropDownMenuID);
		menu.style.left = evt.pageX-100 + "px";
		menu.style.top = evt.pageY-50 + "px";
		menu.style.display = "block";
	}
	
	HideComponentDropDown()
	{
		let menu = document.getElementById(DropDownMenuID);
		menu.style.display = "none";
	}
	
	Enable()
	{
		if(!super.Enable()) return false;
		
		Scene.AddSelectedListener(this, this.HandleSelection);
		Scene.AddDeselectedListener(this, this.HandleDeselection);
		
		if(!this.RunOnce)
		{
			//Because web standards are utter shit we have to do all of this dynamically each time.
			//This is because events apparently can't be attached to invisible objects sometimes.
			let listRoot = document.getElementById(DropDownListID);
			let components = Array.from(TypedObject.Types).filter(x => {
				return x.IsDerivedFrom("BaseComponent") && !x.HasAttribute("NoMenuDisplay");
			});
			for(let comp of components)
			{
				let li = document.createElement('li');
				listRoot.append(li);
				
				li.className = "ContextMenuItem";
				li.id = "Dropdown:" + comp.Name;
				li.innerHTML = comp.Name;
				li.onclick = this.AddComponentToEnt.bind(this);
			}
			this.RunOnce = true;
		}
		return true;
	}
	
	Disable()
	{
		if(!super.Disable()) return false;
		
		this.ClearInspector();
		Scene.RemoveSelectedListener(this.HandleSelection);
		Scene.RemoveDeselectedListener(this.HandleDeselection);
		
		this.HideComponentDropDown();
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
		
		Editor.DrawStringField(parentDiv, ent, "name", "Name");
		
		let components = ent.Components;
		for(let i = 0; i < components.length; i++)
			this.DrawComponent(parentDiv, ent, components[i], i);
		
		Editor.DrawButton(parentDiv, "+ Component", this.DisplayComponentDropDown.bind(this), null, "margin:10px 0 10px 0; width:95%");
	}
	
	DrawComponent(parentDiv, ent, comp, index)
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
		if(!type.HasAttribute("NoMenuDisplay"))
		{
			let button = Editor.DrawPressable(componentDiv, "", "CloseButton", (evt) => {
				ent.Components[index].Destroy();
				this.ClearInspector();
				this.DrawInspector(this.PanelDiv, ent);
				}, "float:right");
			button.setAttribute("ComponentIndex", index);
		}
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
						this.#Bindings.push(Editor.DrawAssetDropdown(parentDiv, comp, propName, label, assetSet, this.AssetMan));
					break;
				}
				
				ColorLog("Unknown datatype for "+comp.type+"."+propName+". Inspector control cannot be displayed.", "warning");
				
				break;
			}
		}
	}
	
}
