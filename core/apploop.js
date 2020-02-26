import Time from './time.js';

let UpdateCallbacks = [];

export function MainLoop(timeStamp)
{
	Time.UpdateTime(timeStamp);	
	StepFrame();
	requestAnimationFrame(MainLoop);
}

export function StepFrame()
{
	for(let callback of UpdateCallbacks)
		callback();
}

function AddUpdateCallback(func)
{
	if(typeof func == "function")
		UpdateCallbacks.push(func);
}

function RemoveUpdateCallback(func)
{
	let i = UpdateCallbacks.indexOf(func);
	if(i > -1)
		UpdateCallbacks.splice(i, 1);
	else throw new Error("Function '" + func.name + "' not found in update callback list. Cannot be removed from update.");
}


export { AddUpdateCallback, RemoveUpdateCallback };

