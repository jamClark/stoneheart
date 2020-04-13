import TypedObject from './../../core/type.js';
import BaseComponent from './../../ecs/basecomponent.js';
import {TriggerEnterEvent, TriggerStayEvent, TriggerExitEvent} from './../../systems/collisionevent.js';
import {ChangeHealthCmd} from './health.js';
import {ExecuteAtRate} from './../../core/utility.js';
import Time from './../../core/time.js';


TypedObject.RegisterFactoryMethod("Damage", () => { return new Damage(); });
TypedObject.RegisterType("Damage", "BaseComponent", () =>
{
	let type = TypedObject.GetType("Damage");
	type.AddSerializedProp('Amount', 'DamageMode', 'Rate');
	type.AddInspectorProp(["float","Amount"], ["enum", "Damage Mode"], ["float","Damage Rate"]);

});

let DamageModes = {
	Enter: 0,
	Stay: 1,
}
export {DamageModes};

/// 
/// 
/// 
export default class Damage extends BaseComponent
{
	#Amount = 1;
	#Mode = DamageModes.Enter;
	#RateAccum = 1;
	#LastTime = -111110;
	
	constructor()
	{
		super();
		this.Rate = 1;
	}
	
	OnEnable()
	{
		if(this.#Mode == DamageModes.Enter)
			this.Entity.AddListener(TriggerEnterEvent, this);
		else if(this.#Mode == DamageModes.Stay)
			this.Entity.AddListener(TriggerStayEvent, this);
	}
	
	OnDisable()
	{
		if(this.#Mode == DamageModes.Enter)
			this.Entity.RemoveListener(TriggerEnterEvent, this);
		else if(this.#Mode == DamageModes.Stay)
			this.Entity.RemoveListener(TriggerStayEvent, this);
	}
	
	get Amount() { return this.#Amount; }
	set Amount(val) { this.#Amount = val; }
	
	get DamageMode() { return this.#Mode; }
	set DamageMode(val)
	{
		let changed = false;
		if(val != this.#Mode && this.enabled)
		{
			changed = true;
			this.OnDisable();
		}
		this.#Mode = val;
		
		if(changed) this.OnEnable();
	}
	
	
	HandleMessage(sender, msg)
	{
		if(this.#Mode == DamageModes.Stay)
		{
			if(Time.time - this.#LastTime > this.Rate)
				this.#RateAccum = 1;
			this.#RateAccum = ExecuteAtRate(this.Rate, this.#RateAccum, this.SendDamageMessages.bind(this), msg.Contact.ColA.Entity, msg.Contact.ColB.Entity);
			this.#LastTime = Time.time;
		}
		else this.SendDamageMessages(msg.Contact.ColA.Entity, msg.Contact.ColB.Entity)
	}
	
	SendDamageMessages(ent1, ent2)
	{
		this.Entity.SendMessage(ent1, ChangeHealthCmd.Shared.Modify(this.#Amount));
		this.Entity.SendMessage(ent2, ChangeHealthCmd.Shared.Modify(this.#Amount));
	}
}




