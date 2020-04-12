
/// 
/// Base class for all messages sent via the tntity message dispatcher.
/// 
export default class EntityMessage
{
	constructor()
	{
		this.type = this.constructor.name;
	}
	
	/// 
	/// This is needed to that we can confirm objects being passed
	/// around are of the correct type.
	/// 
	static get IsEntityMessage() { return true; }
	
}
