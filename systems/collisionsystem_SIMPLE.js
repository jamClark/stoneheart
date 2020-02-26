import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import Rect from './../core/rect.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';
import BoxCollider from './boxcollider.js';
import Rigidbody from './rigidbody.js';
import {CollisionEnterEvent, CollisionStayEvent, CollisionExitEvent} from './collisionevent.js';
//import SpatialPartition from './../spacialpartion.js';

const DepenetrationScale = 0.92;
const per = 0.95;
const fudge = 0.01;

/// 
/// Stores the contact information between two colliders.
/// 
class ContactManifold
{
	constructor(colA, colB)
	{
		this.ColA = colA;
		this.TransA = colA.GetComponent(WorldPos);
		this.RectA = colA.WorldRect(this.TransA.position);
		
		this.ColB = colB;
		this.TransB = colB.GetComponent(WorldPos);
		this.RectB = colB.WorldRect(this.TransB.position);
		
		this.Normal = null;
		this.Hit = null;
		this.Penetration = 0;
	}
	
	/// 
	/// Creates a new instance of a ContactManifold and copies this instances data to it.
	/// 
	Copy()
	{
		let mani = new ContactManifold(this.ColB, this.ColB);
		mani.Normal = this.Normal;
		mani.Hit = this.Hit;
		mani.Penetration = this.Penetration;
		return mani;
	}
	
	/// 
	/// Returns true if the colliders contacting are the same.
	/// 
	IsSamePair(manifold)
	{
		return ((manifold.ColA == this.ColA && manifold.ColB == this.ColB) ||
				(manifold.ColA == this.ColB && manifold.ColB == this.ColA));
	}
}


/// 
/// TODO: A spacial partioning system is needed to optimize collision broadphase checks.
/// 
/// TODO: Event triggers: Enter, Stay, Exit
/// 
/// 
export default class CollisionSystem extends BaseComponentSystem
{
	#DepenSkinScale;
	
	#StaticColliders = [];
	#StaticTriggers = [];
	#DynamicObjects = [];
	
	#Contacts = []; //collisions betwen a dynamic object and a static one
	#TriggerContacts = []; //collision between a dynamic object and a trigger
	#DynamicContacts = []; //collisions between two dynamic objects
	
	#ContactHistory = [];
	#TriggerHistory = [];
	#DynamicHistory = [];
	
	
	constructor(debug = true)
	{
		super(WorldPos, BoxCollider);
		this.DepenSkin = 1;
		this.DebugMode = debug;
	}
	
	set DepenSkin(size) { this.#DepenSkinScale = 1 / Math.max(size, 0.0001); }
	get DepenSkin() { return this.#DepenSkinScale / 1; }
	
	/// 
	/// Performs debug rendering only. All collision is handled in the FixedProcess().
	/// 
	Process(entity, pos, collider)
	{
		if(this.DebugMode)
		{
			let color = "white";
			if(collider.IsStatic)
				color = collider.IsTrigger ? "yellow" : "white";
			else color = "green";
			let r = collider.WorldRect(pos.position);
			Debug.DrawRect(r, color);
		}
	}
	
	/// 
	/// 
	/// 
	Register(collider)
	{
		let ent = collider.Entity;
		if(ent == null)
			throw new Error("Collider was not attached to an Entity.");
		
		let pos = ent.GetComponent(WorldPos);
		if(pos == null)
			throw new Error("Collider must have a WorldPos component in order to be registered with the CollisionSystem.");
		
		
		if(collider.IsStatic)
		{
			if(collider.IsTrigger)
				this.#StaticTriggers.push(collider);
			else this.#StaticColliders.push(collider);
		}
		//NOTE: there are no non-static triggers, everything non-static is just a 'dynamic object'
		else this.#DynamicObjects.push(collider);
	}
	
	/// 
	/// Synthesizes all potential dynamic-dynamic or dynamic-static contacts.
	/// Static-static contacts are not considered.
	/// 
	FixedProcess(entity, pos, collider)
	{
		//TODO: implement a spacial partition to speed up potential contact checks
		
		//we aren't checking to see if static objects collide with anything
		if(collider.IsStatic) return;
		
		entity.GetComponent(Rigidbody).IsGrounded = false;
		//dynamic-static colliders
		let myRect = collider.WorldRect(pos.position);
		for(let c of this.#StaticColliders)
		{
			let otherRect = c.WorldRect(c.GetComponent(WorldPos).position);
			if(myRect.IsOverlapping(otherRect) && (collider.LayerMask & c.LayerMask))
			{
				let man = this.CreateContactManifold(collider, c);
				if(man != null) this.#Contacts.push(man);
			}
		}
		this.#Contacts = this.CullDuplicates(this.#Contacts);
		
		//dynamic-static triggers
		for(let t of this.#StaticTriggers)
		{
			let otherRect = t.WorldRect(t.GetComponent(WorldPos).position);
			if(myRect.IsOverlapping(otherRect) && (collider.LayerMask & t.LayerMask))
			{ 
				let man = this.CreateContactManifold(collider, t);
				if(man != null) this.#TriggerContacts.push(man);
			}
		}
		this.#TriggerContacts = this.CullDuplicates(this.#TriggerContacts);
		
		//dynamic-dynamic triggers
		for(let d of this.#DynamicObjects)
		{
			if(d == collider) continue; //don't check for self collisions, obviously
			let otherRect = d.WorldRect(d.GetComponent(WorldPos).position);
			if(myRect.IsOverlapping(otherRect) && (collider.LayerMask & d.LayerMask))
			{
				let man = this.CreateContactManifold(collider, d);
				if(man != null) this.#DynamicContacts.push(man);
			}
		}
		this.#DynamicContacts = this.CullDuplicates(this.#DynamicContacts);
		
		
	}
	
	/// 
	/// Removes contact pairs from the list that are duplicates. 
	///
	CullDuplicates(contacts)
	{
		let uniques = [];
		
		for(let con of contacts)
		{
			let dupe = false;
			for(let u of uniques)
			{
				if((u.ColA == con.ColA && u.ColB == con.ColB) ||
				   (u.ColA == con.ColB && u.ColB == con.ColA))
					dupe = true;
			}
			if(!dupe) uniques.push(con);
		}
		
		return uniques;
	}
	
	/// 
	/// Helper for creating a contact manifold betwen two colliders.
	/// 
	CreateContactManifold(col1, col2)
	{
		if(col1 == null || col2 == null) return null;
		
		let aTrans = col1.GetComponent(WorldPos);
		let aPos = aTrans.position;
		let aRect = col1.WorldRect(aPos);
		
		let bTrans = col2.GetComponent(WorldPos);
		let bPos = bTrans.position;
		let bRect = col2.WorldRect(bPos);
		
		let ab = bRect.Center.Sub(aRect.Center);
		let aHalfWidth = aRect.Width * 0.5;
		let bHalfWidth = bRect.Width * 0.5;
		let xOverlap = aHalfWidth + bHalfWidth - Math.abs(ab.x);
		
		if(xOverlap > 0)
		{
			let aHalfHeight = aRect.Height * 0.5;
			let bHalfHeight = bRect.Height * 0.5;
			let yOverlap = aHalfHeight + bHalfHeight - Math.abs(ab.y);
			if(yOverlap > 0)
			{
				let manifold = new ContactManifold(col1, col2);
				
				//find min rect of collisions - this will be needed for determining the hit location
				let right = Math.min(aRect.Right, bRect.Right);
				let left = Math.max(aRect.Left, bRect.Left);
				let top = Math.min(aRect.Top, bRect.Top);
				let bottom = Math.max(aRect.Bottom, bRect.Bottom);
				
				if(xOverlap < yOverlap)
				{
					//points towards B
					if(ab.x < 0)
					{
						manifold.Normal = new Vector2(1, 0);
					}
					else 
					{
						manifold.Normal = new Vector2(-1, 0);
					}
					manifold.Penetration = xOverlap;
					top = top-((top-bottom)*0.5);
				}
				else
				{
					//point towards B
					if(ab.y < 0)
					{
						manifold.Normal = new Vector2(0, 1);
						//HACK ALERT: Assuming gravity vector here and setting grounded state based on that!
						col1.Entity.GetComponent(Rigidbody).IsGrounded = true;
					}
					else
					{
						manifold.Normal = new Vector2(0, -1);
					}
					manifold.Penetration = yOverlap;
					left = left+((right-left)*0.5);
					
				}
				
				manifold.Hit = new Vector2(left, top);
				window.Debug.DrawPoint(manifold.Hit, "magenta");
				return manifold;
			}
		}
		return null;
	}
	
	/// 
	/// Calculates a depentration vector for a dynamic body against a static body.
	/// It is assumed that the first collider in the contact is the dynamic body.
	/// 
	Depenetrate(contact)
	{
		return contact.Normal.Mul(DepenetrationScale * (Math.max(contact.Penetration - fudge, 0.0) / per));
	}
	
	/// 
	/// Helper method for just handling dynamic-static collider contact pairs.
	///
	ProcessContacts()
	{
		for(let contact of this.#Contacts)
		{
			let depen = this.Depenetrate(contact);
			let trans = contact.ColA.GetComponent(WorldPos);
			trans.Translate(depen);
			let body = contact.ColA.GetComponent(Rigidbody);
			if(body == null)
				throw new Error("The dynamic body in this contact pair was not set as 'ColA' in the manifold.");
			else body.NegateVelocity(contact.Normal.Mul(-1));
		}
	}
	
	/// 
	/// Resolves all contacts after each entity has been processed in turn.
	/// 
	PostFixedProcess()
	{
		this.ProcessContacts();
		
		this.ResolveCollisionHistoryEvents(this.#Contacts, this.#ContactHistory);
		this.ResolveCollisionHistoryEvents(this.#TriggerContacts, this.#TriggerHistory);
		this.ResolveCollisionHistoryEvents(this.#DynamicContacts, this.#DynamicHistory);
		
		this.#Contacts = [];
		this.#TriggerContacts = [];
		this.#DynamicContacts = [];
	}
	
	/// 
	/// Determines the difference beweeen the current contact state and a past one
	/// and triggers collision events as needed.
	/// 
	/// BUG: Enter/Exit events are triggering twice on bodies affected by gravity. 
	///      This is due to depentration forces. 
	/// UPDATE: This was fixed by scaling the depen vector down ever so slightly 
	///      but that doesn't guarantee it won't happen.
	/// 
	ResolveCollisionHistoryEvents(current, historic)
	{
		//determine which events are entering or staying by comparing
		//the current version of the contacts list to a historic version.
		//Update the historic as needed.
		for(let c of current)
		{
			let i = this.FindCollisionInList(c, historic);
			if(i < 0)
			{
				let msg = new CollisionEnterEvent(c);
				c.ColA.Entity.SendMessage(c.ColB.Entity, msg);
				c.ColB.Entity.SendMessage(c.ColA.Entity, msg);
				historic.push(c);
			}
			else
			{
				//The contact info (Hit point, normal, depen, etc) will be out of date
				//in the historic version so we need to send the current version instead.
				//At this time there is no need to replce the historic version but that
				//could change in the future. If it does, this would be the place to do that.
				let msg = new CollisionStayEvent(c);
				c.ColA.Entity.SendMessage(c.ColB.Entity, msg);
				c.ColB.Entity.SendMessage(c.ColA.Entity, msg);
			}
		}
		
		//determine which events are exiting by comparing the current version
		//of the contacts list to a historic version. Update the historic as needed.
		//Note: Not the most efficient thing to alter the original array but
		//at least it lets us work around the lack of out parameters.
		for(let i = historic.length-1; i >= 0; i--)
		{
			let ci = this.FindCollisionInList(historic[i], current);
			if(ci < 0)
			{
				let c = historic[i];
				let msg = new CollisionExitEvent(c);
				c.ColA.Entity.SendMessage(c.ColB.Entity, msg);
				c.ColB.Entity.SendMessage(c.ColA.Entity, msg);
				historic.splice(i, 1);
			}
		}
	}
	
	/// 
	/// Helper method for finding a contact manifold within a list.
	/// 
	FindCollisionInList(manifold, list)
	{
		for(let i = 0; i < list.length; i++)
		{
			if(manifold.IsSamePair(list[i]))
				return i;
		}
		
		return -1;
	}
}

CollisionSystem.Layers = 
{
	LayerNone: 0,
	
	Layer1: 1,
	Layer2: 2,
	Layer3:	4,
	Layer4: 8,
	Layer5: 16,
	Layer6:	32,
	Layer7: 64,
	Layer8: 128,
	
}

CollisionSystem.Layers.LayerAll = 	CollisionSystem.Layers.Layer1 | CollisionSystem.Layers.Layer2 | 
									CollisionSystem.Layers.Layer3 | CollisionSystem.Layers.Layer4 | 
									CollisionSystem.Layers.Layer5 | CollisionSystem.Layers.Layer6 | 
									CollisionSystem.Layers.Layer7 | CollisionSystem.Layers.Layer8;
	
	
