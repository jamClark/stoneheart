import Factory from './factory.js';
import {LoadFileSync} from './../core/filereader.js';

/// 
/// This is used to handle serializing and desieralizeing all objects within a scene.
///
/// TODO: We need an automated way of determining what objects in a scene should be registered with what systems.
///       This will require idetifying the type of each object and using some kind of lookup table to determine
///		  how to handle the registration.
///
/// TODO: We need a way of linking serialized objects info to the correct factory method for instantiating them.
/// 
export default class SceneManager
{
	#AssetMan;
	#EntMan;
	#SysMan;
	
	
	constructor(assetManager, entityManager, systemManager)
	{
		this.#AssetMan = assetManager;
		this.#EntMan = entityManager;
		this.#SysMan = systemManager;
	}
	
	async LoadScene(path)
	{	
		let lines = LoadFileSync(path).split('\n');
		let lineCount = 1;
		for(let line of lines)
		{
			let ent = null;
			try { ent = JSON.parse(line); }
			catch(e)
			{
				console.log("Failed parsing on line: " + lineCount);
				throw e;
			}
			if(ent != null && ent.length != 0)
				await Factory[ent.name].apply(Factory, ent.params);
			lineCount++;
		}
	}
	
	UnloadCurrentScene()
	{
		//TODO: Remove all non-essential entities from the entity manager
		for(let ent of this.#EntMan.Entities)
		{
			if(ent.DoNotUnload == null || ent.DoNotUnload == false)
				this.#EntMan.UnregisterEntity(ent);
		}
	}
	
	SaveScene(path)
	{
		let output = "";
		for(let ent of this.#EntMan.Entities)
		{
			if(ent._factoryInfo != null)
				output += JSON.stringify(ent._factoryInfo) + "\n";
		}
		
		return output;
	}
}
