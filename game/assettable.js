/// 
/// Big dumb list of assets used by this project.
/// 
/// Mostly used for simplicity and to avoid hard-coding
/// asset directories as well as a way to more easily
/// handle the utterly, insanely asyncronous nature
/// asset loading in javascript.
///
export default class Assets
{
	static #Anims = 
	{
		ANA_R:		"./assets/sprites/ana_right.anim",
		ANA_L:		"./assets/sprites/ana_left.anim",
	}
	static get Anims() { return this.#Anims; }
	
	static #Atlases = 
	{
	}
	static get Atlases() { return this.#Atlases; }
	
	static #Particles = 
	{
	}
	static get Particles() { return this.#Particles; }
	
	static #Sounds = 
	{
		JUMP_1:		"./assets/sfx/jump1.wav",
		LAND_1:		"./assets/sfx/thud1.wav",
	}
	static get Sounds() { return this.#Sounds; }
	
	static #Sprites = 
	{
		ANA_R: 	"./assets/sprites/ana_right.png",
		ANA_L: 	"./assets/sprites/ana_left.png",
	}
	static get Sprites() { return this.#Sprites; }
	
	static #Tiles = 
	{
		DEMO_1:	"./assets/sprites/tileset1.png",
	}
	static get Tiles() { return this.#Tiles; }
	
	
	
	/// 
	/// Pre-loads all assets defined in this file's AssetTable object.
	/// 
	static PreloadAllAssets(assetMan)
	{
		return new Promise(async (resolve) =>
		{
			let preloads = [];
			for(let asset of Object.values(this.#Anims))
				preloads.push(assetMan.LoadAsset(asset));
			for(let asset of Object.values(this.#Atlases))
				preloads.push(assetMan.LoadAsset(asset));
			for(let asset of Object.values(this.#Particles))
				preloads.push(assetMan.LoadAsset(asset));
			for(let asset of Object.values(this.#Sounds))
				preloads.push(assetMan.LoadAsset(asset));
			for(let asset of Object.values(this.#Sprites))
				preloads.push(assetMan.LoadAsset(asset));
			for(let asset of Object.values(this.#Tiles))
				preloads.push(assetMan.LoadAsset(asset));
			
			await Promise.all(preloads);
			resolve();
		});
	}
}
