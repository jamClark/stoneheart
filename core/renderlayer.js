
/// 
/// 
/// 
export default class RenderLayer
{
	#LayerMap = new Map();
	#OnscreenCanvas;
	#OnscreenCtx;
	
	constructor(onscreenCanvas)
	{
		this.#OnscreenCanvas = onscreenCanvas;
		this.#OnscreenCtx = onscreenCanvas.getContext('2d');
	}
	
	get Width() { return this.#OnscreenCanvas.width; }
	get Height() { return this.#OnscreenCanvas.height; }
	
	/// 
	/// Requests an offscreen canvas based on desired render depth. Higher depths
	/// will be rendered on top of lower depths.
	/// 
	RequestLayer(depth = 0)
	{
		let layer = this.#LayerMap.get(depth);
		if(layer == null)
		{
			layer = new OffscreenCanvas(this.#OnscreenCanvas.width, this.#OnscreenCanvas.height);
			layer.getContext('2d').imageSmoothingEnabled = false;
			this.#LayerMap.set(depth, layer);
			
			//sort the map by keys
			let newKeys = Array.from(this.#LayerMap.keys()).sort((a, b) => a - b);
			let newMap = new Map();
			for(let key of newKeys)
				newMap.set(key, this.#LayerMap.get(key));
			this.#LayerMap = newMap;
		}
		
		return layer;
	}
	
	/// 
	/// Clears all offscreen canvas layers. Does not affect the main onscreen canvas.
	/// 
	ClearLayers()
	{
		for(let [k,v] of this.#LayerMap)
			v.getContext('2d').clearRect(0, 0, this.Width, this.Height);
	}
	
	/// 
	/// Renders all offscreen canvases to the main onscreen canvas in order of depth.
	/// 
	CompositeLayers()
	{
		this.#OnscreenCtx.fillStyle = "black";
		this.#OnscreenCtx.fillRect(0, 0, this.Width, this.Height);
		//if(c == null) c = new OffscreenCanvas(this.Width, this.Height);	
		//let ctx = c.getContext('2d');
		//ctx.fillStyle = "black";
		//ctx.fillRect(0, 0, c.width, c.height);
		
		for(let [k,v] of this.#LayerMap)
			this.#OnscreenCtx.drawImage(v, 0, 0);
	}
	
}




