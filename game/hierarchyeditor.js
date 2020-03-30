import Editor from './editor.js';
import EditorPanel from './editorpanel.js';
import WorldPosition from './../systems/worldpos.js';
import * as Scene from './sceneeditor.js';
import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'


/// 
/// 
/// 
export default class HierarchyEditor extends EditorPanel
{
	#EntityMan;
	#EntToHierarchy = new Map();
	#Bindings = [];
	
	constructor(entityManager, elementId, title, rootDiv, canvas, camera, assetManager)
	{
		super(elementId, title, rootDiv, canvas, camera, assetManager);
		this.#EntityMan = entityManager;
		//this.DrawFloatField(this.PanelDiv, Editor.GetSnapSettings(), "x", "Snap X", 50);
		//this.DrawFloatField(this.PanelDiv, Editor.GetSnapSettings(), "y", "Snap Y", 50);
	}
	
	Enable()
	{
		if(!super.Enable()) return false;
		this.#EntityMan.AddEntityRegisteredListener(this.HandleEntityAdded.bind(this));
		this.#EntityMan.AddEntityUnregisteredListener(this.HandleEntityRemoved.bind(this));
		this.BuildList(this.PanelDiv, this.#EntityMan.Entities);
		this.StartListeningForSelection();
		
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
		
		return true;
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
				let indices = evt.target.getAttribute('h-index');
				let ents = entList;
				let ent = ents[indices[0]];
				
				for(let count = 1; count < indices.length; count++)
				{
					//recursively search down the hierarchy
					let index = parseInt(indicies[count]);
					ent = ent.GetComponent(WorldPosition).GetChild(index);
				}
				
				//NOTE: We disable handle selected events or we'll have an infinite loop!
				this.StopListeningForSelection();
				Scene.ForceSelection(ent);
				this.StartListeningForSelection();
			});
			
			this.#Bindings.push(Editor.BindHTML(li, ent, "name"));
			//recursively append child elements
			if(trans!= null && trans.ChildCount > 0)
				this.BuildList(li, trans.Children, selectionIndex);
		}
		
		//TODO: databind to the entities names	
	}
	
	ClearList(rootDiv)
	{
		this.#EntToHierarchy.clear();
		
		//TODO: remove the databind to the entities names
		while(rootDiv.children.length > 0)
			rootDiv.removeChild(rootDiv.children[0]);
	}
}