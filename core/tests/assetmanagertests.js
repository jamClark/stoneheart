import {ColorLog, describe, it, expect} from './../testutility.js';
import AssetManager from './../assetmanager.js';



export function TestAssetManager()
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing AssetManager ----------------", "info");
		testImageLoading().then(() => 
		{
			testSoundLoading().then(() => 
			{
				testLoadingAnims().then((result) => {resolve();});
			});
		});
	});
}

function testLoadingAnims()
{
	let ANIM_1 = "./core/tests/test_anim1.anim";
	let ANIM_2 = "./core/tests/test_anim2.anim";
	let ANIM_1_COPY = ANIM_1;
	let MISSING_ANIM = ANIM_1;//"./doesnotexist.anim";
	
	return new Promise(async (resolve) => 
	{
		let man = new AssetManager();
		let [anim0, anim1, anim2, anim1Copy] = await Promise.all(
			[
			man.LoadAsset(MISSING_ANIM),
			man.LoadAsset(ANIM_1),
			man.LoadAsset(ANIM_2),
			man.LoadAsset(ANIM_1_COPY)
			]);
		
		describe("Testing direct return value of Animation load promise", () =>
		{
			let man = new AssetManager();
			let p = man.LoadAsset(ANIM_1);
			it("Confirm returned value is a promise", () => expect(p instanceof Promise).toBe(true));
		});
		
		describe("Testing promised animation callbacks", async () =>
		{
			it("Promised first animation is of type Object", () => expect(typeof anim1 === "object").toBe(true));
			it("Promised second animation is of type Object", () => expect(typeof anim2 === "object").toBe(true));
			it("Promised second animation is of type Object", () => expect(typeof anim1Copy === "object").toBe(true));
			
			it("Second animation is not the same object as first", () => expect(anim1 == anim2).toBe(false));
			it("Copy of first animation is same object as first", () => expect(anim1 == anim1Copy).toBe(true));
			
		});
		
		//TODO: Need to learn how to intercept all resource 404-based errors so that they can be handled with a promise
		/*
		describe("Testing animation load failure", async () =>
		{
			it("Promised return value is an error string", () => expect(typeof anim0 === "string").toBe(true));
		});
		*/
		resolve(true);
	});
}

function testSoundLoading()
{
	let SOUND_1 = "./core/tests/test_sound1.wav";
	let SOUND_2 = "./core/tests/test_sound2.wav";
	let SOUND_1_COPY = SOUND_1;
	let MISSING_SOUND = SOUND_1;//"./doesnotexist.wav";
	
	return new Promise(async (resolve) => 
	{
		let man = new AssetManager();
		let [snd0, snd1, snd2, snd1Copy] = await Promise.all(
			[
			man.LoadAsset(MISSING_SOUND),
			man.LoadAsset(SOUND_1),
			man.LoadAsset(SOUND_2),
			man.LoadAsset(SOUND_1_COPY)
			]);
		
		describe("Testing direct return value of Sound load promise", () =>
		{
			let man = new AssetManager();
			let p = man.LoadAsset(SOUND_1);
			it("Confirm returned value is a promise", () => expect(p instanceof Promise).toBe(true));
		});
		
		describe("Testing promised Sound callbacks", async () =>
		{
			it("Promised first sound is of type HTMLAudioElement", () => expect(snd1 instanceof HTMLAudioElement).toBe(true));
			it("Promised second sound is of type HTMLAudioElement", () => expect(snd2 instanceof HTMLAudioElement).toBe(true));
			it("Promised second sound is of type HTMLAudioElement", () => expect(snd1Copy instanceof HTMLAudioElement).toBe(true));
			
			it("Second sound is not the same object as first", () => expect(snd1 == snd2).toBe(false));
			it("Copy of first sound is same object as first", () => expect(snd1 == snd1Copy).toBe(true));
			
		});
		
		//TODO: Need to learn how to intercept all resource 404-based errors so that they can be handled with a promise
		/*
		describe("Testing Sound load failure", async () =>
		{
			it("Promised return value is an error string", () => expect(typeof snd0 === "string").toBe(true));
		});
		*/
		resolve(true);
	});
}

function testImageLoading()
{
	let IMAGE_1 = "./core/tests/test_image1.png";
	let IMAGE_2 = "./core/tests/test_image2.png";
	let IMAGE_1_COPY = IMAGE_1;
	let MISSING_IMAGE = IMAGE_1;//"./doesnotexist.png";
	
	return new Promise(async (resolve) => 
	{
		let man = new AssetManager();
		let [img0, img1, img2, img1Copy] = await Promise.all(
			[
			man.LoadAsset(MISSING_IMAGE),
			man.LoadAsset(IMAGE_1),
			man.LoadAsset(IMAGE_2),
			man.LoadAsset(IMAGE_1_COPY)
			]);
		
		describe("Testing direct return value of Image load promise", () =>
		{
			let man = new AssetManager();
			let p = man.LoadAsset(IMAGE_1);
			it("Confirm returned value is a promise", () => expect(p instanceof Promise).toBe(true));
		});
		
		describe("Testing promised Image callbacks", async () =>
		{
			it("Promised first image is of type HTMLImageElement", () => expect(img1 instanceof HTMLImageElement).toBe(true));
			it("Promised second image is of type HTMLImageElement", () => expect(img2 instanceof HTMLImageElement).toBe(true));
			it("Promised second image is of type HTMLImageElement", () => expect(img1Copy instanceof HTMLImageElement).toBe(true));
			
			it("Second image is not the same object as first", () => expect(img1 == img2).toBe(false));
			it("Copy of first image is same object as first", () => expect(img1 == img1Copy).toBe(true));
			
		});
		
		//TODO: Need to learn how to intercept all resource 404-based errors so that they can be handled with a promise
		/*
		describe("Testing Image load failure", async () =>
		{
			it("Promised return value is an error string", () => expect(typeof img0 === "string").toBe(true));
		});
		*/
		resolve(true);
	});
}