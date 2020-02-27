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
	static #Table =
	{
		SPRITE_ANA_R: 	"./assets/sprites/ana_right.png",
		SPRITE_ANA_L: 	"./assets/sprites/ana_left.png",
		
		ANIM_ANA_R:		"./assets/sprites/ana_right.anim",
		ANIM_ANA_L:		"./assets/sprites/ana_left.anim",
		
		JUMP_SFX_1:		"./assets/sfx/jump1.wav",
		LAND_SFX_1:		"./assets/sfx/thud1.wav",
		
		TILESET1:"./assets/sprites/tileset1.png",
	}
	
	static get Table() { return this.#Table; }
	
	/// 
	/// Pre-loads all assets defined in this file's AssetTable object.
	/// 
	static PreloadAllAssets(assetMan)
	{
		return new Promise(async (resolve) =>
		{
			let preloads = [];
			for(let asset of Object.values(this.#Table))
				preloads.push(assetMan.LoadAsset(asset));
			await Promise.all(preloads);
			resolve();
		});
	}
}
