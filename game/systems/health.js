import TypedObject from './../../core/type.js';
import BaseComponent from './../../ecs/basecomponent.js';
import EntityMessage from './../../ecs/entitymessage.js';

TypedObject.RegisterFactoryMethod("Health", () => { return new Health(); });
TypedObject.RegisterType("Health", "BaseComponent", () =>
{
	let type = TypedObject.GetType("Health");
	type.AddSerializedProp('Current', 'Min', 'Max');
	type.AddInspectorProp(["float","Current"], ["float","Min"], ["float","Max"]);

});


/// 
/// 
/// 
export default class Health extends BaseComponent
{
	#Current = 100;
	#Min = 0;
	#Max = 100;
	
	constructor()
	{
		super();
	}
	
	OnEnable()
	{
		this.Entity.AddListener(ChangeHealthCmd, this);
	}
	
	OnDisable()
	{
		this.Entity.RemoveListener(ChangeHealthCmd, this);
	}
	
	get Current() { return this.#Current; }
	set Current(val)
	{
		this.#Current = val;
		if(this.#Current < this.#Min) this.#Current = this.#Min;
		else if(this.#Current > this.#Max) this.#Current = this.#Max;
	}
	
	get Min() { return this.#Min; }
	set Min(val)
	{
		this.#Min = val;
		if(this.#Min > this.#Max)
			this.#Max = this.#Min;
	}
	
	get Max() { return this.#Max; }
	set Max(val)
	{
		this.#Max = val; 
		if(this.#Max < this.#Min)
			this.#Min = this.#Max;
	}
	
	HandleMessage(sender, msg)
	{
		console.log("Oof! " + msg.Amount);
		this.Current -= msg.Amount;
	}
}


/// 
/// 
/// 
export class ChangeHealthCmd extends EntityMessage
{
	static #Shared = new ChangeHealthCmd(1);
	
	constructor(amount = 1)
	{
		super();
		this.Amount = amount;
	}
	
	static get Shared() { return ChangeHealthCmd.#Shared; }
	
	Modify(amount)
	{
		this.Amount = amount;
		return this;
	}
}

