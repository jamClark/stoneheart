import Rect from './rect.js';

/// 
/// Utility class for drawing debugging information onscreen.
/// 
export default class DebugTools
{
	#Context;
	
	constructor(canvas, camera, debug = true)
	{
		this.debugCanvas = canvas;
		this.debugCamera = camera;
		this.DebugDraw = debug;
		this.#Context = (canvas == null) ? null : canvas.getContext("2d");
	}
	
	DrawRect(r, color = "white")
	{
		//debug drawing of all collider objects
		if(this.DebugDraw && this.#Context != null && this.debugCamera != null)
		{
			r.Center = this.debugCamera.WorldToView(r.Center);
			
			this.#Context.beginPath();
			this.#Context.rect(r.Left, r.Top, r.Width, -r.Height);
			this.#Context.strokeStyle = color;
			this.#Context.stroke();
			this.#Context.closePath();
		}
	}
	
	DrawPoint(vec, color = "blue")
	{
		//debug drawing of all collider objects
		if(this.DebugDraw && this.#Context != null && this.debugCamera != null)
		{
			let r = new Rect(vec.x, vec.y, 5, 5);
			r.Center = this.debugCamera.WorldToView(vec);
			
			this.#Context.beginPath();
			this.#Context.rect(r.Left, r.Top, r.Width, -r.Height);
			this.#Context.strokeStyle = color;
			this.#Context.stroke();
			this.#Context.closePath();
		}
	}
	
	DrawLine(start, end, color = "blue")
	{
		//debug drawing of all collider objects
		if(this.DebugDraw && this.#Context != null && this.debugCamera != null)
		{
			let s = this.debugCamera.WorldToView(start);
			let e = this.debugCamera.WorldToView(end);
			
			this.#Context.beginPath();
			this.#Context.moveTo(s.x, s.y);
			this.#Context.lineTo(e.x, e.y);
			this.#Context.strokeStyle = color;
			this.#Context.stroke();
			this.#Context.closePath();
		}
	}
	
	DrawRay(start, dir, len = 1, color = "blue")
	{
		//debug drawing of all collider objects
		if(this.DebugDraw && this.#Context != null && this.debugCamera != null)
		{
			let s = this.debugCamera.WorldToView(start);
			let e = this.debugCamera.WorldToView(start.Add(dir.normalized.Mul(len)));
			
			this.#Context.beginPath();
			this.#Context.moveTo(s.x, s.y);
			this.#Context.lineTo(e.x, e.y);
			this.#Context.strokeStyle = color;
			this.#Context.stroke();
			this.#Context.closePath();
		}
	}
	
	DrawDebugRay(start, dir, color = "blue")
	{
		//debug drawing of all collider objects
		if(this.DebugDraw && this.#Context != null && this.debugCamera != null)
		{
			let s = this.debugCamera.WorldToView(start);
			let e = this.debugCamera.WorldToView(end);
			
			this.#Context.beginPath();
			this.#Context.moveTo(s.x, s.y);
			this.#Context.lineTo(e.x, e.y);
			this.#Context.strokeStyle = color;
			this.#Context.stroke();
			this.#Context.closePath();
		}
	}
}

