import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import TiledSpriteRenderer from './tiledspriterenderer.js';
import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import WorldPos from './worldpos.js';

///
///
///
export default class TiledSpriteRendererSystem extends BaseComponentSystem
{
	#Canvas = null;
	#RenderLayer = null;
	
	constructor(renderLayer, camera)
	{
		super(TiledSpriteRenderer, WorldPos)
		this.Camera = camera;
		this.#RenderLayer = renderLayer;
	}
	
	Process(entity, spriteComp, worldPos)
	{
		//if null, this likely means we're still
		//pending on a load operation. Just early-out
		if(spriteComp.Sprite == null)
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
		let screenRect = new Rect(spriteComp.Rect);
		screenRect.Center = this.Camera.WorldToView(worldPos.position.Add(screenRect.Center));
		
		let scaledWidth = spriteComp.Width * xScale;
		let scaledHeight = spriteComp.Height * yScale;
		
		TiledSpriteRendererSystem.DrawTiledImage(
			this.#RenderLayer.RequestLayer(spriteComp.Layer).getContext('2d'), 
			spriteComp.Sprite,
			//source rect,
			srcX, srcY, srcWidth, srcHeight,
			//dest rect
			screenRect.Left,
			screenRect.Bottom, //use bottom due to screen-space being flipped on y-axis
			screenRect.Width,
			screenRect.Height,
			xScale, yScale
			);
	}
	
	/// 
	/// Helper for rendering an image that is tiled
	/// 
	static DrawTiledImage(context, image, srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight, xScale, yScale)
	{	
		let cellWidth = srcWidth * xScale;
		let cellHeight = srcHeight * yScale;
		
		let xFrac = (destWidth / cellWidth);
		let xRepeat = Math.floor(xFrac);
		xFrac -= xRepeat;
		
		let yFrac = (destHeight / cellHeight);
		let yRepeat = Math.floor(yFrac);
		yFrac -= yRepeat;
		
		
		for(let y = 0; y < yRepeat; y++)
		{
			for(let x = 0; x < xRepeat; x++)
			{
				context.drawImage(image, srcX, srcY, srcWidth, srcHeight, 
								destX+(x*cellWidth), destY+(y*cellHeight),
								cellWidth, cellHeight);
			}
			//fractional part on x-axis
			if(xFrac > 0)
			{
				context.drawImage(image, srcX, srcY, xFrac*srcWidth, srcHeight, 
								destX+(xRepeat*cellWidth), destY+(y*cellHeight),
								cellWidth*xFrac, cellHeight);
			}
		}
		
		//fractional part on y-axis
		if(yFrac > 0)
		{
			for(let x = 0; x < xRepeat; x++)
			{
				context.drawImage(image, srcX, srcY, srcWidth, yFrac*srcHeight, 
								destX+(x*cellWidth), destY+(yRepeat*cellHeight),
								cellWidth, cellHeight*yFrac);
			}
			
			//fractional part on x-axis
			if(xFrac > 0)
			{
				context.drawImage(image, srcX, srcY, xFrac*srcWidth, yFrac*srcHeight, 
								destX+(xRepeat*cellWidth), destY+(yRepeat*cellHeight),
								cellWidth*xFrac, cellHeight*yFrac);
			}
		}
		
	}
	
}