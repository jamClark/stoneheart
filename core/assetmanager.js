
/// 
/// 
/// 
export default class AssetManager
{
	#Images = new Map();
	#AudioClips = new Map();
	#Anims = new Map();
	#Patterns = new Map();
	
	#PendingImageLoads = [];
	#PendingAudioClipLoads = [];
	#PendingAnimLoads = [];
	
	#Context;
	
	constructor(context)
	{
		this.#Context = context;
		
		//append a couple useful methods to the HTMLAudioElement object
		if(typeof Audio.prototype.replay === 'undefined')
		{
			Audio.prototype.stop = function() {
				this.pause();
				this.currentTime = 0;
			}
			Audio.prototype.replay = function(volume = 1.0) {
				this.stop();
				this.volume = volume;
				this.play();
			}
		}
	}
	
	get AssetLoadsPending()
	{
		for(let asset of this.Images.values())
		{
			if(typeof asset == null) return true;
		}
		
		for(let asset of this.AudioClips.values())
		{
			if(typeof asset == null) return true;
		}
		
		for(let asset of this.#Anims.values())
		{
			if(typeof asset == null) return true;
		}
		
		return false;
	}
	
	/// 
	/// Returns a pattern object given a previously loaded sprite and a pattern type.
	/// 
	RequestPattern(sprite, repetition = "repeat")
	{
		if(!(sprite instanceof HTMLImageElement))
			throw new Error("Pattern requires a valid image type.");
		
		let id = sprite.src + repetition;
		let result = this.#Patterns.get(id);
		if(result == undefined)
		{
			result = this.#Context.createPattern(sprite, repetition);
			this.#Patterns.set(id, result);
		}
		
		return result;
	}
	
	///
	/// Loads an supported asset (currently jpg, png, and mp3 assets) and returns a promise
	/// of that asset or an error message if failure.
	/// 
	LoadAsset(path)
	{
		let extPattern = /\.[0-9a-z]+$/i;
		let i = path.search(extPattern);
		if(i > 0)
		{
			let ext = path.slice(i, path.length);
			if(ext == ".jpg" || ext == ".png")
				return this._LoadFramework(path, this.#Images, this._LoadImage.bind(this), this.#PendingImageLoads);
			else if(ext == ".mp3" || ext == ".wav")
				return this._LoadFramework(path, this.#AudioClips, this._LoadAudioClip.bind(this), this.#PendingAudioClipLoads);
			else if(ext == ".anim")
				return this._LoadFramework(path, this.#Anims, this._LoadAespriteAnim.bind(this), this.#PendingAnimLoads);
			else return new Promise((resolve, fail) => { fail("Invalid asset type passed to AssetManager.LoadAsset(): " + ext);});
		}
		
		return new Promise((resolve, fail) => { fail("Could not determine file extension");});
	}
	
	/// 
	/// Returns a promise of an asset to load. The actual resource-specific
	/// loading logic is deferred to the 'loadCallback' that it provides.
	/// 
	_LoadFramework(path, resourceMap, loadCallback, pendingCallbacks)
	{
		return new Promise( (resolve, fail) =>
		{
			//if this image has already been loaded, just
			//return a reference to that.
			if(resourceMap.has(path))
			{
				//If null, we are waiting on the process but we still need
				//to resolve this one so pass it to the pending resolve/fail callbacks.
				if(resourceMap.get(path) != null)
					resolve(resourceMap.get(path));
				else pendingCallbacks.push([resolve, fail]);
			}
			else
			{
				resourceMap.set(path, null);//this lets us know its pending
				loadCallback(path, resolve, fail, pendingCallbacks);
			}
		});
	}
	
	/// 
	/// Specific load handler for image resources.
	/// 
	_LoadImage(path, resolve, fail, pendingCallbacks)
	{
		let img = new Image();
		img.onload = () =>
		{
			img._AssetManager = this;
			this.#Images.set(path, img);
			resolve(img);
			for(let p of pendingCallbacks)
				p[0](img);
			pendingCallbacks.length = 0;
		}
		img.onerror = () =>
		{
			this.#Images.delete(path);
			for(let p of pendingCallbacks)
				p[1]("Could not access image file at: " + path);
			fail("Could not access image file at: " + path);
			pendingCallbacks.length = 0;
		}
		img.src = path;
	}
	
	/// 
	/// Specific load handler for sound assets.
	/// 
	_LoadAudioClip(path, resolve, fail, pendingCallbacks)
	{
		let snd = new Audio();
		
		snd.onloadeddata = () =>
		{
			this.#AudioClips.set(path, snd);
			resolve(snd);
			for(let p of pendingCallbacks)
				p[0](snd);
			pendingCallbacks.length = 0;
		}
		snd.onerror = () =>
		{
			this.#AudioClips.delete(path);
			for(let p of pendingCallbacks)
				p[1]("Could not access sound file at: " + path);
			fail("Could not access sound file at: " + path);
			pendingCallbacks.length = 0;
		}
		snd.src = path;
		snd.load();
	}
	
	/// 
	/// Specific load handler for Aesprite animations.
	/// 
	/// Not yet implemented.
	/// 
	_LoadAespriteAnim(path, resolve, fail, pendingCallbacks)
	{
		var request = new XMLHttpRequest();
		request.open("GET", path, true);
		request.error = () =>
		{
			this.#Anims.delete(path);
			for(let p of pendingCallbacks)
				p[1]("Could not access anim file at: " + path);
			fail("Could not access anim file at: " + path);
			pendingCallbacks.length = 0;
		}
		request.onload = () =>
		{
			if(request.status == 200)
			{
				let animObject = this._GetActuallyUsefulAnimData(request.responseText);
				this.#Anims.set(path, animObject);
				resolve(animObject);
				for(let p of pendingCallbacks)
					p[0](animObject);
				pendingCallbacks.length = 0;
			}
			else request.error();
		}
		
		request.send();
	}
	
	/// 
	/// Transforms the raw json text of an animation file to
	/// an object with only useful data.
	/// 
	_GetActuallyUsefulAnimData(json)
	{
		let obj = JSON.parse(json);
		let animAsset = {};
		
		//can can assume all frames have the same original frame size within the editor - since they do
		animAsset.OriginalFrameSize = [
			obj["frames"]["0"]["sourceSize"]["w"],
			obj["frames"]["0"]["sourceSize"]["h"]
		];
		
		animAsset.Frames = [];
		//parse per-frame data
		let frameValues = Object.values(obj["frames"]);
		for(let i = 0; i < frameValues.length; i++)
		{
			let frameKey = frameValues[i];
			//x,y pos of source rect on the sprite sheet
			let srcFrame = [
				frameKey["frame"]["x"],
				frameKey["frame"]["y"]
			];
			//width and height of source rect on the spritesheet
			let srcSize = [
				frameKey["frame"]["w"],
				frameKey["frame"]["h"]
			];
			//offset from original sprite frame in order to trim for sheet placement
			let offset = [
				frameKey["spriteSourceSize"]["x"],
				frameKey["spriteSourceSize"]["y"]
			];
			
			animAsset.Frames.push({
				SrcFrame: srcFrame,
				SrcSize: srcSize,
				Offset: offset,
				Duration: frameKey["duration"]
			});
		}
		
		animAsset.Anims = new Map();
		//parse animation data
		let animArray = obj["meta"]["frameTags"];
		for(let i = 0; i < animArray.length; i++)
		{
			let a = animArray[i];
			animAsset.Anims.set(a["name"], [a["from"], a["to"]]);
		}
		
		animAsset.GetFrameRange = function(animName)
		{
			return this.Anims[animName]
		}
		
		return animAsset;
	}
}