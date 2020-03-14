
///
/// Base class from which all components must derive.
///
export default class BaseComponent
{
	constructor()
	{
		this.type = this.constructor.name;
		this.enabled = true;
		this._Entity = null;
		this._RunOnce = true;
	}
	
	get Entity() { return this._Entity; }
	
	OnAttached() {}
	OnDetached() {}
	OnDestroy() {}
	OnEnable() {}
	OnDisable() {}
	Awake() {}
	
	_InnerEnable()
	{
		if(this._RunOnce != null)
		{
			delete this._RunOnce;
			this.Awake();
		}
		this.OnEnable();
	}
	
	/// 
	/// Removes this component from it's entity and destroys it.
	/// 
	Destroy()
	{
		if(this.Entity.RemoveComponent(this) != null)
			this.OnDestroy();
	}
	
	GetComponent(comp) { return this._Entity.GetComponent(comp); }
	HandleMessage(sender, msg) {}
}
