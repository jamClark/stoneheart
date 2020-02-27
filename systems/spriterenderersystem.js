import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import SpriteRenderer from './spriterenderer.js';
import Vector2 from './../core/vector2.js';
import WorldPos from './worldpos.js';

///
///
///
export default class SpriteRendererSystem extends BaseComponentSystem
{
	#RenderLayer = null;
	#Renderer;
	
	constructor(renderLayer, camera)
	{
		super(SpriteRenderer, WorldPos)
		this.Camera = camera;
		this.#RenderLayer = renderLayer;
	}
	
	Process(entity, spriteComp, worldPos)
	{
		//if null, this likely means we're still
		//pending on a load operation. Just early-out
		if(spriteComp.Sprite === null)
			return;
		
		let xScale = this.#RenderLayer.Width / this.Camera.VirtualX;
		let yScale = this.#RenderLayer.Height / this.Camera.VirtualY;
		
		//get source frame
		let srcX = spriteComp.FrameRect[0];
		let srcY = spriteComp.FrameRect[1];
		let srcWidth = spriteComp.FrameRect[2];
		let srcHeight = spriteComp.FrameRect[3];
		let frameOffsetX = spriteComp.FrameRect[4];
		let frameOffsetY = spriteComp.FrameRect[5];
		let originalWidth = spriteComp.FrameRect[6];
		let originalHeight = spriteComp.FrameRect[7];
		
		//get screen world pos
		let pos = this.Camera.WorldToView(worldPos.position.Add(spriteComp.LocalOffset));
		
		//offset by image size and image offset
		pos.x += frameOffsetX * xScale;
		pos.y += frameOffsetY * yScale;
		pos.x -= (originalWidth / 2) * xScale * spriteComp.DestScale[0];
		pos.y -= (originalHeight / 2) * yScale * spriteComp.DestScale[1];
		
		/*
		//debugging tools for registratgions
		this.#Context.rect(320-30, 240, 60, 20);
		this.#Context.rect(320-30, 240, 60, 100);
		this.#Context.strokeStyle = "white";
		this.#Context.stroke();
		*/
		
		//this.#Context.fillStyle = "#000000";
		this.#RenderLayer.RequestLayer(spriteComp.Layer).getContext('2d').drawImage(
			spriteComp.Sprite,
			
			//source rect
			srcX, 
			srcY,
			srcWidth,
			srcHeight,
			
			//dest rect on screen
			pos.x, // should be scaled by 'world units per pixel'
			pos.y, // should be scaled by 'world units per pixel'
			srcWidth * xScale * spriteComp.DestScale[0],
			srcHeight * yScale * spriteComp.DestScale[1],
			);
	}
}