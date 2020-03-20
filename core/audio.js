import Vector2 from './vector2.js';


/// 
/// 
/// 
export class AudioMixer
{
}


/// 
/// 
///
let DiscardModes = {
	DropNewest: 0,
	DropOldest: 1,
	DropSoftest: 2,
}


/// 
/// Universal interface for queing and playing sounds.
/// 
export class Audio
{
	#CullingRect;
	#PlayingVoices = [];
	#MaxVoices;
	#AudioContext;
	
	
	static get Instance() { return Audio._Instance; }
	static get Context() { return Audio.Instance.AudioContext; }
	static Init(cullingRect, maxVoices)
	{
		Audio._Instance = new Audio(cullingRect, maxVoices);
	}
	
	get AudioContext() { return this.#AudioContext; }
	
	
	constructor(cullingRect, maxVoices)
	{
		//define a custom clamp function because apparently js doesn't have one :/
		if(Math.clamp == null)
		{
			Math.clamp = function(value, min, max)
				{ return Math.min(Math.max(value, min), max);};
		}
		
		if(Audio._Instance == null)
			Audio._Instance = this;
		
		try{
			window.AudioContext = window.AudioContext||window.webkitAudioContext;
			this.#AudioContext = new AudioContext();
		}
		catch(e)
		{
			alert("Web Audio not supported on this browser.");
		}
		
		this.#CullingRect = cullingRect; //world-space rect that is used to determine if sounds can be heard on not when played.
		this.#MaxVoices = maxVoices;
		
	}
	
	/// 
	/// Updates this system's internal worldposition and any currently looping sound sources.
	/// 
	Update(listenerPos)
	{
		this.#CullingRect.Center = listenerPos;
		
		let remove = [];
		
		//decide which voices should stay connected based on allowed voice count and who is still playing
		for(let i = 0; i < this.#PlayingVoices.length;)
		{
			let v = this.#PlayingVoices[i];
			if(!v.IsPlaying)
			{
				this.#PlayingVoices.splice(i, 1);
				continue;
			}
			
			if(this.#CullingRect.IsOverlapping(v.Position))
				v.ConnectToSource();
			else v.DisconnectFromSource();
			
			i++;
		}
		
	}
	
	/// 
	/// 
	/// 
	PlaySource(audioSource, discardMode = DiscardModes.DropSoftest)
	{
		if(!(audioSource instanceof AudioSource))
			throw new Error("Invalid param type passed to Audio.PlaySource.");
		if(audioSource.Clip == null)
			return;
		
		let voice = this.#AudioContext.createBufferSource();
		voice.buffer = audioSource.Clip.Data;
		voice.loop = audioSource.Loop;
		voice.start(0);
		this.#PlayingVoices.push(audioSource);
		return voice;
	}
	
	/// 
	/// 
	/// 
	StopSource(audioSource)
	{
		if(!(audioSource instanceof AudioSource))
			throw new Error("Invalid param type passed to Audio.StopSource.");
		
		let index = this.#PlayingVoices.map(v => v[0]).indexOf(audioSource);
		if(index < 0) return;
		
		
	}
	
	/// 
	/// Plays a sound once in a fire-and-forget fashion.
	/// 
	static PlayOnce(clip, volume = 1, position = null)
	{
		let source = new AudioSource();
		source.Position = !position ? Audio.Instance.#CullingRect.Center : position;
		source.Volume = volume;
		source.Clip = clip;
		source.Play();
	}
}


/// 
/// A single instance of a sound playing in the scene.
///
export class AudioSource
{
	#Loop = false;
	#Volume = 1;
	#Position = new Vector2();
	#Clip = null;
	#SourceNode;
	#StartTime = -100;
	
	get Clip() { return this.#Clip; }
	set Clip(clip) 
	{
		if(!(clip instanceof AudioClip))
			throw new Error("Invalid argument. Must supply an AudioClip object.");
		this.#Clip = clip;
	}
	
	get Loop() { return this.#Loop; }
	set Loop(value)
	{
		this.#Loop = value;
		if(this.#SourceNode != null)
			this.#SourceNode.loop = value;
	}
	
	get Volume() { return this.#Volume; }
	set Volume(value) { this.#Volume = Math.clamp(value, 0, 1); }
	
	get Position() { return new Vector2(this.#Position); }
	set Position(pos) { this.#Position = pos; }
	
	get IsPlaying()
	{
		return 	this.#Clip != null && this.#SourceNode != null &&
				(this.#Loop || Audio.Context.currentTime - this.#StartTime < this.#Clip.Data.duration);
	}
	
	/// 
	/// For internal use by the Audio object to start/stop sounds without interrupting playback times.
	/// 
	ConnectToSource()
	{
		this.#SourceNode.connect(Audio.Context.destination);
	}
	
	/// 
	/// For internal use by the Audio object to start/stop sounds without interrupting playback times.
	/// 
	DisconnectFromSource()
	{
		this.#SourceNode.disconnect();
	}
	
	
	Play(offset = 0)
	{
		this.#SourceNode = Audio.Instance.PlaySource(this);
		this.#StartTime = Audio.Context.currentTime - offset;
	}
	
	Stop()
	{
		Audio.Instance.StopSource(this);
		this.#SourceNode = null;
	}
}


/// 
/// Represents a single audio clip loaded from a file.
/// 
export class AudioClip
{
	get IsAudioClip() { return true; }
	#Buffer = null;
	
	constructor(buffer = null, src = null)
	{
		this.#Buffer = buffer;
		this.src = null;
	}
	
	get Data() { return this.#Buffer; }
	set Data(buffer) { this.#Buffer = buffer; }
}

