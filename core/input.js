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
	
	static #GamepadDetected = false;
	static #GamepadAxesStates = [];
	static #GamepadButtonStates = [];
	static #GamepadButtonDown = [];
	static #GamepadButtonUp = [];
	
	static #Canvas;
	
	/// 
	/// Initializes the input system and begins listening for key events from the 
	/// given global source. For a browser app, 'window' will usually be passed
	/// as the 'global' parameter.
	/// 
	static Init(global, canvas)
	{
		Input.#Canvas = canvas;
		Input.MousePosX = 0;
		Input.MousePosY = 0;
		if(Input.#Inited) return;
		Input.#Inited = true;
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
		global.document.onmousedown = (evt) => Input.InjectKeyDown("MOUSE0_"+evt.button);
		global.document.onmouseup = (evt) => Input.InjectKeyUp("MOUSE0_"+evt.button);
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
	
	static GetMouseDown(button)
	{
	}
	
	static GetMouseUp(button)
	{
	}
	
	static GamepadConnected(evt, connecting)
	{
		Input.#GamepadDetected = true;
		let gamepad = evt.gamepad;
		
		for(let b of gamepad.buttons)
		{
			Input.#GamepadButtonStates.push(false);
			Input.#GamepadButtonDown.push(false);
			Input.#GamepadButtonUp.push(false);
		}
		for(let b of gamepad.axes)
			Input.#GamepadAxesStates.push(0);
		
	}
	
	static GamepadDisconnected(evt, connecting)
	{
		Input.GamepadDetected = false;
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
			Input.#GamepadButtonDown[i] = (b && !Input.#GamepadButtonStates[i]) ? true : false;
			Input.#GamepadButtonUp[i] = (!b && Input.#GamepadButtonStates[i]) ? true : false;
			Input.#GamepadButtonStates[i] = b;
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
		
		for(let i = 0; i < Input.#GamepadButtonStates.length; i++)
		{
			Input.#GamepadButtonStates[i] = false;
			Input.#GamepadButtonDown[i] = false;
			Input.#GamepadButtonUp[i] = false;
		}
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
	static GetButton(index)
	{
		return Input.#GamepadButtonStates[index];
	}
	
	/// 
	/// 
	/// 
	static GetButtonDown(index)
	{
		return Input.#GamepadButtonDown[index];
	}
	
	/// 
	/// 
	/// 
	static GetButtonUp(index)
	{
		return Input.#GamepadButtonUp[index];
	}
	
	/// 
	/// 
	/// 
	static GetAxis(index)
	{
		return Input.#GamepadAxesStates[index];
	}
}