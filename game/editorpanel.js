import Editor from './editor.js';

/// 
/// Base implementation for all editor panels.
/// 
export default class EditorPanel
{
	#DirectionDiv;
	#PanelDiv;
	#RootDiv;
	#Canvas;
	#Camera;
	#AssetMan;
	#Enabled;
	
	#MenuClosers = [];
	
	get PanelDiv() { return this.#PanelDiv; }
	get RootDiv() { return this.#RootDiv; }
	get Canvas() { return this.#Canvas; }
	get Camera() { return this.#Camera; }
	get AssetMan() { return this.#AssetMan; }
	get Enabled() { return this.#Enabled; }
	
	constructor(elementId, title, rootDiv, canvas, camera, assetManager)
	{
		this.#RootDiv = rootDiv;
		this.#Canvas = canvas;
		this.#Camera = camera;
		this.#AssetMan = assetManager;
		
		//we are wrapping our user div in another one so that we can control the direction of the resizing.
		this.#DirectionDiv = document.createElement('div');
		this.#DirectionDiv.className = "EditorPanel";
		this.#DirectionDiv.id = elementId;
		this.#PanelDiv = document.createElement('div');
		this.#PanelDiv.style = "direction: ltr; overflow:auto; width:100%; height: 100%;";
		this.#DirectionDiv.appendChild(this.#PanelDiv);
		
		//window.addEventListener("click", this.CheckForValidContextClicks);
	}
	
	/// 
	/// This event handler closes all active context menus if a valid target is not clicked.
	/// 
	CheckForValidContextClicks(evt)
	{
	}
	
	Enable()
	{
		if(this.#Enabled) return false;
		this.#Enabled = true;
		
		this.#RootDiv.appendChild(this.#DirectionDiv);
		return true;
	}
	
	Disable()
	{
		if(!this.#Enabled) return false;
		this.#Enabled = false;
		
		this.#RootDiv.removeChild(this.#DirectionDiv);
		return true;
	}
	
	RegisterMenuCloser(func)
	{
		this.#MenuClosers.push(func);
	}
	
	CloseContextMenus()
	{
		for(let func of this.#MenuClosers)
			func();
	}
}