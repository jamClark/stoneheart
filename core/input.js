import Time from './time.js';
import Vector2 from './vector2.js';

/// 
/// A universal keyboard input system that provides consitent
/// input state throughout the frame. This only support keyboard and one gamepad.
/// 
export default class Input
{
	static #PendingKeyDown = new Map();
	static #KeyDown = new Map();
	static #KeyHeld = new Map();
	static #PendingKeyUp = new Map();
	static #KeyUp = new Map();
	
	static #Blocking = false;
	static #Inited = false;
	
	static #Gamepad;
	static #GamepadDetected = false;
	static #GamepadAxesStates = [];
	
	static #Canvas;
	
	/// 
	/// Initializes the input system and begins listening for key events from the 
	/// given global source. For a browser app, 'window' will usually be passed
	/// as the 'global' parameter.
	/// d
	static Init(global, canvas)
	{
		Input.#Canvas = canvas;
		Input.MousePosX = 0;
		Input.MousePosY = 0;
		if(Input.#Inited) return;
		Input.#Inited = true;
		
		window.onblur = () => { Input.ReleaseAllInputs(); }
		window.onfocus = () => { Input.ReleaseAllInputs(); }
		global.addEventListener("keydown", (evt) => Input.InjectKeyDown(evt.code), false);
		global.addEventListener("keyup", (evt) => Input.InjectKeyUp(evt.code), false);
		global.addEventListener("gamepadconnected", Input.GamepadConnected);
		global.addEventListener("gamepaddisconnected", Input.GamepadDisconnected);
		canvas.onmousemove = (evt) =>
		{
			let rect = canvas.getBoundingClientRect();
			Input.MousePosX = evt.clientX - rect.left;
			Input.MousePosY = evt.clientY - rect.top;
		}
		canvas.onmousedown = (evt) => Input.InjectKeyDown("MOUSE0_"+evt.button);
		canvas.onmouseup = (evt) => Input.InjectKeyUp("MOUSE0_"+evt.button);
	}
		
	static GamepadConnected(evt, connecting)
	{
		Input.#GamepadDetected = true;
		Input.#Gamepad = evt.gamepad;
		
		for(let b of Input.#Gamepad.axes)
			Input.#GamepadAxesStates.push(0);
		
	}
	
	static GamepadDisconnected(evt, connecting)
	{
		Input.GamepadDetected = false;
	}
	
	/// 
	/// Sends a signal as though all currently held inputs were released. This can be
	/// used to effectively reset the input state in the event that the application looses focus.
	/// 
	static ReleaseAllInputs()
	{
		//clear out all pending keydowns
		Input.#PendingKeyDown.clear();
		
		//for each key currently down or held, send a keyup
		for(let k of Input.#KeyDown.keys())
			Input.InjectKeyUp(k);
		
		for(let k of Input.#KeyHeld.keys())
			Input.InjectKeyUp(k);
		
		Input.#KeyDown.clear();
		Input.#KeyHeld.clear();
		
		for(let i = 0; i < Input.#GamepadAxesStates.length; i++)
			Input.#GamepadAxesStates[i] = 0.0;
	}
	
	/// 
	/// Saves the state of the input system for later restoration.
	/// 
	static SaveState()
	{
		let copy = function(src) {
			let dest = new Map();
			for(let [k,v] of src)
				dest.set(k, v);
			return dest;
		}
				
		return {
			IsInputState: true,
			PendingKeyDown: copy(Input.#PendingKeyDown),
			KeyDown: 		copy(Input.#KeyDown),
			KeyHeld: 		copy(Input.#KeyHeld),
			PendingKeyUp:	copy(Input.#PendingKeyUp),
			KeyUp:			copy(Input.#KeyUp),
		};
	}
	
	/// 
	/// Restores a previously saved input state.
	/// 
	static LoadState(state)
	{
		if(!state.IsInputState)
			throw new Error("Invalid argument. Expected an Input-generated save state object.");
		
		let copy = function(src) {
			let dest = new Map();
			for(let [k,v] of src)
				dest.set(k, v);
			return dest;
		}
		
		Input.#PendingKeyDown = copy(state.PendingKeyDown);
		Input.#KeyDown = copy(state.KeyDown);
		Input.#KeyHeld = copy(state.KeyHeld);
		Input.#PendingKeyUp = copy(state.PendingKeyUp);
		Input.#KeyUp = copy(state.KeyUp);
	}
	
	/// 
	/// Injects a key-code into the key pressed input handler. The input is expected to be
	/// in the format of a javascript keyevent.code
	/// 
	static InjectKeyDown(code)
	{
		//don't process a key down event if the key is already being held
		if(this.#KeyHeld.has(code)) return;
		if(Input.#Blocking)
			Input.#PendingKeyDown.set(code, Time.time);
		else
		{
			Input.#KeyDown.set(code, Time.time);
			Input.#KeyHeld.set(code, Time.time);
		}
	}
	
	/// 
	/// Injects a key-code into the key released input handler. The input is expected to be
	/// in the format of a javascript keyevent.code
	/// 
	static InjectKeyUp(code)
	{
		if(Input.#Blocking)
			Input.#PendingKeyUp.set(code, Time.time);
		else Input.#KeyUp.set(code, Time.time);
	}
	
	/// 
	/// Updates the internal state of this Input system to match
	/// the current state of the gamepad if any.
	/// 
	static PollGamepad()
	{
		if(!Input.#GamepadDetected)
			return;
		
		//for some dumbass reason we have to manually tell the API to poll interally with this
		let gamepad = navigator.getGamepads()[0];
		if(gamepad == null)
			return;
		
		for(let i = 0; i < gamepad.buttons.length; i++)
		{
			let b = gamepad.buttons[i].pressed;
			if(b) Input.InjectKeyDown("GAMEPAD0_"+i);
			else Input.InjectKeyUp("GAMEPAD0_"+i);
		}
		
		
		for(let i = 0; i < gamepad.axes.length; i++)
			Input.#GamepadAxesStates[i] = gamepad.axes[i];
		
	}
	
	/// 
	/// Maps a gamepad button
	/// 
	static MapButton(index, name)
	{
	}
	
	/// 
	/// 
	/// 
	static MapKey(code, name)
	{
	}
	
	/// 
	/// 
	/// 
	static MapGamepadAxis(index, name)
	{
	}
	
	/// 
	/// 
	/// 
	static MapKeyboardAxis(positiveKey, negativeKey, name)
	{
	}
	
	/// 
	/// Resets all internal states store in the input system, effectively
	/// zeroing out all input for this frame.
	/// 
	static ClearState()
	{
		Input.#PendingKeyDown = new Map();
		Input.#KeyDown = new Map();
		Input.#PendingKeyUp = new Map();
		Input.#KeyUp = new Map();
		
		for(let i = 0; i < Input.#GamepadAxesStates.length; i++)
			Input.#GamepadAxesStates[i] = 0;
		
	}
	
	/// 
	/// Marks the point in the program where the program will block any changes to input state.
	/// Any changes that occur at this time will be buffered and processed next frame. Input
	/// should not be read before this has been invoked.
	///
	/// TODO: Store a frozen state of the gamepad here.
	///
	static BeginInputBlock()
	{
		if(Input.#Blocking)
			throw new Error("Mismatched input block. Did you forget to call Input.EndInputBlock()?");
		Input.#Blocking = true;
		Input.PollGamepad();
	}
	
	/// 
	/// Marks the point in the program where it will allow input state changes again.
	/// Any pending changes will be applied here. Input should not be read after invoking.
	/// 
	/// TODO: Update gamepad state here
	/// 
	static EndInputBlock()
	{
		if(!Input.#Blocking)
			throw new Error("Mismatched input block. Did you forget to call Input.BeginInputBlock() first?");
		
		Input.#KeyDown.clear();
		for(let kv of Input.#KeyUp)
			Input.#KeyHeld.delete(kv[0]);
		Input.#KeyUp.clear();
		
		
		for(let kv of Input.#PendingKeyDown)
		{
			Input.#KeyDown.set(kv[0], kv[1]);
			Input.#KeyHeld.set(kv[0], kv[1]);
		}
		Input.#PendingKeyDown.clear();
		
		for(let kv of Input.#PendingKeyUp)
			Input.#KeyUp.set(kv[0], kv[1]);
		Input.#PendingKeyUp.clear();
		
		Input.#Blocking = false;
	}
		
	/// 
	/// Was this key pressed or held during this frame?
	/// 
	static GetKey(code)
	{
		return Input.#KeyHeld.has(code);
	}
	
	///
	/// Returns true only for the frame that the given key was pressed down.
	/// 
	static GetKeyDown(code)
	{
		return Input.#KeyDown.has(code);
	}
	
	/// 
	/// Returns true only for the frame that the given key was released.
	/// 
	static GetKeyUp(code)
	{
		return Input.#KeyUp.has(code);
	}
	
	/// 
	/// 
	/// 
	static GetButton(button)
	{
		return Input.GetKey("GAMEPAD0_"+ button);
	}
	
	/// 
	/// 
	/// 
	static GetButtonDown(button)
	{
		return Input.GetKeyDown("GAMEPAD0_"+button);
	}
	
	/// 
	/// 
	/// 
	static GetButtonUp(button)
	{
		return Input.GetKeyUp("GAMEPAD0_"+button);
	}
	
	/// 
	/// 
	/// 
	static GetAxis(button)
	{
		return Input.#GamepadAxesStates[button];
	}
	
	static GetMouse(button)
	{
		return Input.GetKey("MOUSE0_"+ button);
	}
	
	static GetMouseDown(button)
	{
		return Input.GetKeyDown("MOUSE0_"+button);
	}
	
	static GetMouseUp(button)
	{
		return Input.GetKeyUp("MOUSE0_"+button);
	}
	
	static get MousePosition()
	{
		return new Vector2(this.MousePosX, this.MousePosY);
	}
}