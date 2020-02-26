import EntityMessage from './../ecs/entitymessage.js';
//import {ContactManifold} from './collisionsystem.js';

/// 
/// Event that is sent to entities when they collide.
/// 
export default class CollisionEvent extends EntityMessage
{
	constructor(manifold)
	{
		super();
		this.Contact = manifold.Copy();
	}
}

export class CollisionStayEvent extends CollisionEvent {}
export class CollisionEnterEvent extends CollisionEvent {}
export class CollisionExitEvent extends CollisionEvent {}