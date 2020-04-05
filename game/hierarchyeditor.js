import Editor from './editor.js';
import EditorPanel from './editorpanel.js';
import * as Scene from './sceneeditor.js';
import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'

import Entity from './../ecs/entity.js';
import WorldPosition from './../systems/worldpos.js';
import SelectionBox from './../systems/selectionbox.js';

const HierarchyMenuId = "HierarchyContextMenu";
const HierarchyItemMenuId = "HierarchyItemContextMenu";
/// 
/// 
/// 
export default class HierarchyEditor extends EditorPanel
{
	#EntityMan;
	#EntToHierarchy = new Map();
	#Bindings = [];
	
	#ContextMenuItem; //stores the menu item we right-clicked in the hierarchy
	
	constructor(entityManager, elementId, title, rootDiv, canvas, camera, assetManager)
	{
		super(elementId, title, rootDiv, canvas, camera, assetManager);
		this.#EntityMan = entityManager;
		
		this.RegisterMenuCloser(this.RemoveContextMenu.bind(this));
		this.RegisterMenuCloser(this.RemoveItemContextMenu.bind(this));
		
		let body = document.getElementById('ContextMenus');
		body.innerHTML = body.innerHTML + `
		<div class="ContextMenu" id="${HierarchyMenuId}">
			<ul class="ContextMenuList">
				<li class="ContextMenuItem" id="CreateEntItem">Create Entity</li>
			</ul>
		</div>
		
		<div class="ContextMenu" id="${HierarchyItemMenuId}">
			<ul class="ContextMenuList">			
				<li class="ContextMenuItem" id="DuplicateEntItem">Duplicate</li>
				<li class="ContextMenuItem" id="CreateEntItem2">Create Entity</li>
				<li class="ContextMenuItem" id="DeleteEntItem">Delete</li>
			</ul>
		</div>
		`;
		
		document.getElementById("DuplicateEntItem").onclick = this.DuplicateEntity.bind(this);
		document.getElementById("CreateEntItem").onclick = this.CreateEntity.bind(this);
		document.getElementById("CreateEntItem2").onclick = this.CreateEntity.bind(this);
		document.getElementById("DeleteEntItem").onclick = this.DeleteEntity.bind(this);
		
		//this.DrawFloatField(this.PanelDiv, Editor.GetSnapSettings(), "x", "Snap X", 50);
		//this.DrawFloatField(this.PanelDiv, Editor.GetSnapSettings(), "y", "Snap Y", 50);
	}
	
	Init(collisionSystem, renderSystem)
	{
	}
	
	Enable()
	{
		if(!super.Enable()) return false;
		this.#EntityMan.AddEntityRegisteredListener(this.HandleEntityAdded.bind(this));
		this.#EntityMan.AddEntityUnregisteredListener(this.HandleEntityRemoved.bind(this));
		this.BuildList(this.PanelDiv, this.#EntityMan.Entities);
		this.StartListeningForSelection();
		
		this.PanelDiv.addEventListener("contextmenu", this.ShowContextMenu.bind(this));
		return true;
	}
	
	Disable()
	{
		if(!super.Disable()) return false;
		
		for(let binding of this.#Bindings)
			RemoveMemberShadow(binding[0], binding[1]);
		this.#Bindings = [];
		
		this.#EntityMan.RemoveEntityRegisteredListener(this.HandleEntityAdded.bind(this));
		this.#EntityMan.RemoveEntityUnregisteredListener(this.HandleEntityRemoved.bind(this));
		this.ClearList(this.PanelDiv);
		this.StopListeningForSelection();
		this.#EntToHierarchy.clear();
		
		this.RemoveAllContextMenus();
		this.PanelDiv.removeEventListener("contextmenu", this.ShowContextMenu);
		return true;
	}
	
	ShowContextMenu(evt)
	{
		this.CloseContextMenus();
		let menu = document.getElementById(HierarchyMenuId);
		menu.style.left = evt.pageX + "px";
		menu.style.top = evt.pageY + "px";
		menu.style.display = "block";
	}
	
	RemoveContextMenu()
	{
		let menu = document.getElementById(HierarchyMenuId);
		menu.style.display = "none";
	}
	
	ShowItemContextMenu(evt)
	{
		this.CloseContextMenus();
		this.#ContextMenuItem = evt.target;
		let menu = document.getElementById(HierarchyItemMenuId);
		menu.style.left = evt.pageX + "px";
		menu.style.top = evt.pageY + "px";
		menu.style.display = "block";
	}
	
	RemoveItemContextMenu()
	{
		let menu = document.getElementById(HierarchyItemMenuId);
		this.#ContextMenuItem = null;
		menu.style.display = "none";
	}
	
	RemoveAllContextMenus()
	{
		this.RemoveContextMenu();
		this.RemoveItemContextMenu();
	}
	
	///
	/// Given an html element in the hierarchy list, this will return the matching entity.
	/// 
	HierarchyItemToEnt(element)
	{
		let indices = element.getAttribute('h-index');
		let ents = this.#EntityMan.Entities;
		let ent = ents[indices[0]];
		
		for(let count = 1; count < indices.length; count++)
		{
			//recursively search down the hierarchy
			let index = parseInt(indices[count]);
			ent = ent.GetComponent(WorldPosition).GetChild(index);
		}
		return ent;
	}
	
	DuplicateEntity(evt)
	{
		let ent = this.HierarchyItemToEnt(this.#ContextMenuItem);
		alert("Duplicate " + ent.name + " not yet supported.");
		this.RemoveAllContextMenus();
	}
	
	DeleteEntity(evt)
	{
		let ent = this.HierarchyItemToEnt(this.#ContextMenuItem);
		ent.Destroy();
		//TODO: If the item is selected, we're fucked.
		this.StopListeningForSelection();
		Scene.ForceSelection(null);
		this.StartListeningForSelection();
		
		this.ClearList(this.PanelDiv);
		this.BuildList(this.PanelDiv, this.#EntityMan.Entities);
		
		this.RemoveAllContextMenus();
	}
	
	CreateEntity()
	{
		let ent = new Entity("New Entity");
		let trans = new WorldPosition();
		let selection = new SelectionBox();
		trans.position = this.Camera.Entity.GetComponent(WorldPosition).position;
		ent.AddComponent(trans);
		ent.AddComponent(selection);
		this.#EntityMan.RegisterEntity(ent);
		
		//NOTE: We disable handle selected events or we'll have an infinite loop!
		this.StopListeningForSelection();
		Scene.ForceSelection(ent);
		this.StartListeningForSelection();
		
		this.RemoveAllContextMenus();
	}
	
	StartListeningForSelection()
	{
		Scene.AddSelectedListener(this, this.HandleSelection);
		Scene.AddDeselectedListener(this, this.HandleDeselection);
	}
	
	StopListeningForSelection()
	{
		Scene.RemoveSelectedListener(this.HandleSelection);
		Scene.RemoveDeselectedListener(this.HandleDeselection);
	}
	
	HandleEntityAdded(manager, ent)
	{
		this.ClearList(this.PanelDiv);
		this.BuildList(this.PanelDiv, this.#EntityMan.Entities);
	}
	
	HandleEntityRemoved(manager, ent)
	{
		this.ClearList(this.PanelDiv);
		this.BuildList(this.PanelDiv, this.#EntityMan.Entities);
	}
	
	HandleSelection(selectionBox)
	{
		let element = this.#EntToHierarchy.get(selectionBox.Entity);
		element.className = "HierarchyItemSelected";
		this.LastSelectedItem = element;
	}
	
	HandleDeselection(selectionBox)
	{
		if(this.LastSelectedItem != null)
			this.LastSelectedItem.className = "HierarchyItem";
	}
	
	#LastSelectedItem;
	/// 
	/// TODO: Need a way of linking entity name with entity object in manager.
	///		  This way we know which entity is being selected in a two-way fashion
	///       (i.e. selecting the object allows us to know which hierarchy name to hilight
	///		  and selecting a name in the hiarahcy lets us know which object to select in the scene).
	/// 
	BuildList(rootDiv, entList, indexList)
	{
		let ul = document.createElement('ul');	
		rootDiv.appendChild(ul);
		ul.className = "HierarchyList";
		
		for(let i = 0; i < entList.length; i++)
		{
			let ent = entList[i];
			let trans = ent.GetComponent(WorldPosition);
			
			//build a map for entity index back to each html element.
			//Only do this for the root ent list
			let li = document.createElement('li'); //no ref linked if we end up skipping, but we need this ref now for the mapping below
			if(indexList == null)
				this.#EntToHierarchy.set(ent, li);
			//skip child entities, they'll be handled below recursively.
			if(trans.parent != null)
				continue;
			
			
			ul.appendChild(li);
			li.innerHTML = ent.name;
			let selectionIndex = !indexList ? i:(indexList + "," + i);
			li.setAttribute('h-index', selectionIndex);
			li.className = "HierarchyItem";
			li.addEventListener('click', (evt) => {
				//first, let's figure out the index/indices to the objects in the hierarchy
				if(this.LastSelectedItem != null)
					this.LastSelectedItem.className = "HierarchyItem";
				this.LastSelectedItem = evt.target;
				evt.target.className = "HierarchyItemSelected";
				let ent = this.HierarchyItemToEnt(evt.target);
				
				//NOTE: We disable handle selected events or we'll have an infinite loop!
				this.StopListeningForSelection();
				Scene.ForceSelection(ent);
				this.StartListeningForSelection();
			});
			li.addEventListener("contextmenu", (evt) => {
				evt.preventDefault();
				this.CloseContextMenus();
				evt.stopImmediatePropagation();
				this.ShowItemContextMenu(evt);
			});
			
			this.#Bindings.push(Editor.BindHTML(li, ent, "name"));
			//recursively append child elements
			if(trans!= null && trans.ChildCount > 0)
				this.BuildList(li, trans.Children, selectionIndex);
		}
		
	}
	
	ClearList(rootDiv)
	{
		this.#EntToHierarchy.clear();
		
		while(rootDiv.children.length > 0)
			rootDiv.removeChild(rootDiv.children[0]);
	}
}