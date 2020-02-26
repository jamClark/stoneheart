
/// 
/// 
/// 
export default class MessageDispatch
{
	#Listeners = new Map();
	
	constructor()
	{
	}
	
	AddListener(msgId, callback, boundObj)
	{
		let list = this.#Listeners.get(msgId);
		if(list == null)
		{
			list = [];
			this.#Listeners.set(msgId, list);
		}
		
		list.push([boundObj, callback]);
	}
	
	RemoveListener(msgId, callback)
	{
		let list = this.#Listeners.get(msgId);
		if(list != null)
		{
			let mappedList = list.map( x => x[1]);
			let i = mappedList.indexOf(callback);
			if(i >= 0)
			{
				list = list.splice(i, 1);
				return true;
			}
		}
		
		return false;
	}
	
	RemoveAllListenersOfType(msgId)
	{
		let list = this.#Listeners.get(msgId);
		if(list != null)
		{
			this.#Listeners.set(msgId, []);
			return true;
		}
		
		return false;
	}
	
	RemoveAllListeners()
	{
		this.#Listeners = new Map();
	}
	
	///
	/// 
	///
	PostMessage(msgId, ...params)
	{
		let list = this.#Listeners.get(msgId);
		if(list != null)
		{
			for(let listener of list)
				listener[1].call(listener[0], ...params);
		}
		
	}
}


