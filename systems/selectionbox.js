import BaseComponent from './../ecs/basecomponent.js'
import WorldPos from './worldpos.js';

/// 
/// Provides a means of selecting an Entity using a mouse during edit-mode.
/// The selection region will be the size of the BoxCollider if one is present
/// on the Entity, otherwise it will use a default value of 32x32.
/// 
export default class SelectionBox extends BaseComponent
{
	constructor()
	{
		super();
	}
	
	get Rect()
	{
		let trans = this.Entity.GetComponent(WorldPos);
		if(trans == null)
			throw new Error("Missing WorldPos component!");
		
		let col = this.Entity.GetComponent(WorldPos);
		return (col != null) ? col.WorldRect(trans.position) : this.TranslatedWorldRect(trans.position);
	}
	
	TranslatedWorldRect(worldPos)
	{
		let r = new Rect(0, 0, 32, 32);
		r.Center = r.Center.Add(worldPos);
		return r;
	}
}