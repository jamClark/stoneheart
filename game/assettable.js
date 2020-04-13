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
	static get Anims() { return Assets.#Anims; }
	
	static #Atlases = 
	{
	}
	static get Atlases() { return Assets.#Atlases; }
	
	static #Particles = 
	{
		SPARK_01:	"./assets/sprites/spark_01.png",
		ALERT_01:	"./assets/sprites/alert.png",
	}
	static get Particles() { return Assets.#Particles; }
	
	static #Sounds = 
	{
		JUMP_1:		"./assets/sfx/jump1.wav",
		LAND_1:		"./assets/sfx/thud1.wav",
	}
	static get Sounds() { return Assets.#Sounds; }
	
	static #Sprites = 
	{
		TRIGGER:"./assets/sprites/trigger.png",
		ANA_R: 	"./assets/sprites/ana_right.png",
		ANA_L: 	"./assets/sprites/ana_left.png",
		DEMO_1:	"./assets/sprites/tileset1.png",
		TILE_1:	"./assets/sprites/tileset2.png",
		SPARK_01:	"./assets/sprites/spark_01.png",
		ALERT_01:	"./assets/sprites/alert.png"
	}
	static get Sprites() { return Assets.#Sprites; }
	
	static #Tiles = 
	{
		DEMO_1:	"./assets/sprites/tileset1.png",
		TILE_1:	"./assets/sprites/tileset2.png",
	}
	static get Tiles() { return Assets.#Tiles; }
	
	static GetAssetsOfType(typeName)
	{
		if(typeof this[typeName] === 'undefined')
			return null;
		else return Assets[typeName];
	}
	
	
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
