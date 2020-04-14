import TypedObject from './../../core/type.js';
import BaseComponent from './../../ecs/basecomponent.js';
import EntityMessage from './../../ecs/entitymessage.js';
import Time from './../../core/time.js';

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
	
	get IsDead() { return this.#Current <= this.#Min; }
	
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
		let wasDead = this.IsDead;
		let wasAlive = !wasDead;
		let start = this.#Current;
		
		this.#Current = val;
		if(this.#Current < this.#Min) this.#Current = this.#Min;
		else if(this.#Current > this.#Max) this.#Current = this.#Max;
		
		if(start != this.#Current)
		{
			this.Entity.SendMessage(this.Entity, TookDamage.Shared(val));
			this.Entity.PostMessage(TookDamage.Shared(val));
		}
		if(wasAlive && this.IsDead)
		{
			this.Entity.SendMessage(this.Entity, EntityDied.Shared(this));
			this.Entity.PostMessage(EntityDied.Shared(this));
		}
		else if(wasDead && !this.IsDead)
		{
			this.Entity.SendMessage(this.Entity, EntityRevived.Shared(this));
			this.Entity.PostMessage(EntityRevived.Shared(this));
		}
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
		if(this.IsInvincible) return;
		this.Current -= msg.Amount;
	}
	
	get IsInvincible() { return Time.time - this.#InvincibleStartTime < this.#InvincibleTime; }
	
	#InvincibleStartTime = -10000;
	#InvincibleTime;
	OverlapInvincibility(time)
	{
		if(this.IsInvincible)
		{
			let timeLeft = (this.#InvincibleStartTime + this.#InvincibleTime) - Time.time;
			if(timeLeft < time)
			{
				let diff = time - timeLeft;
				this.#InvincibleTime += diff;
			}
		}
		else
		{
			this.#InvincibleStartTime = Time.time;
			this.#InvincibleTime = time;
		}
	}
}


export class ChangeHealthCmd extends EntityMessage
{
	static #Shared = new ChangeHealthCmd(1);
	
	constructor(amount = 1)
	{
		super();
		this.Amount = amount;
	}
	
	static Shared(amount)
	{
		ChangeHealthCmd.#Shared.Amount = amount;
		return ChangeHealthCmd.#Shared;
	}
}

export class TookDamage extends EntityMessage
{
	static #Shared = new TookDamage(1);
	
	constructor(amount = 1)
	{
		super();
		this.Amount = amount;
	}
	
	static Shared(amount)
	{
		TookDamage.#Shared.Amount = amount;
		return TookDamage.#Shared;
	}
}

export class EntityDied extends EntityMessage 
{
	static #Shared = new EntityDied(1);
	constructor(health) 
	{ 
		super();
		this.Health = health;
	}
	
	static Shared(health)
	{
		EntityDied.#Shared.Health = health;
		return EntityDied.#Shared;
	}
}

export class EntityRevived extends EntityMessage 
{
	static #Shared = new EntityRevived(1);
	constructor(health) 
	{ 
		super(); 
		this.Health = health;
	}
	
	static Shared(health)
	{
		EntityRevived.#Shared.Health = health;
		return EntityRevived.#Shared;
	}
}

