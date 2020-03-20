import BaseComponentSystem from './../ecs/basecomponentsystem.js';
import TiledSpriteRenderer from './tiledspriterenderer.js';
import Vector2 from './../core/vector2.js';
import Rect from './../core/rect.js';
import WorldPos from './worldpos.js';

let temp = 0;

///
/// BUG: Edge case where we have a fractional potion on one axis and the render dest size is smaller on the opposite axis, this causes nothing to be rendered.
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
		
		//get screen world pos
		let screenRect = new Rect(spriteComp.Rect);
		screenRect.Center = this.Camera.WorldToView(worldPos.position.Add(screenRect.Center));
		
		
		
		if(spriteComp.TextureOffset.SqrMag > 0)
		{
			//hackish workaround for issues with offsets when the
			//opposing dimension is less than the size of the original image
			let textureOffsetX = spriteComp.TextureOffset.x == 0 ? 1 : spriteComp.TextureOffset.x;
			let textureOffsetY = spriteComp.TextureOffset.y == 0 ? 1 : spriteComp.TextureOffset.y;
			
			TiledSpriteRendererSystem.DrawTiledImageOffset(
				this.#RenderLayer.RequestLayer(spriteComp.Layer).getContext('2d'), 
				spriteComp.Sprite,
				//source rect,
				srcX, srcY, srcWidth, srcHeight,
				//dest rect
				screenRect.Left,
				screenRect.Bottom, //use bottom due to screen-space being flipped on y-axis
				screenRect.Width,
				screenRect.Height,
				xScale, yScale,
				textureOffsetX,
				textureOffsetY
				);
		}
		else
		{
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
				xScale, yScale,
				);
		}
	}
	
	/// 
	/// Draws a simple tiled-image within a given region of the screen. This version supports tiling offsets but
	/// can induce drastic performance costs so is not recommened when not needed.
	/// 
	static DrawTiledImageOffset(context, image, srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight, xScale, yScale, xOffset, yOffset)
	{	
		let xPixelOffset = xOffset * srcWidth * xScale;
		let yPixelOffset = yOffset * srcHeight * yScale;
		let xInversePixelOffset = (1 - xOffset) * srcWidth * xScale;
		let yInversePixelOffset = (1 - yOffset) * srcHeight * yScale;
		
		let cellWidth = srcWidth * xScale;
		let cellHeight = srcHeight * yScale;
		
		let xFracNat = (destWidth-xPixelOffset) / cellWidth;
		let xFrac = destWidth/cellWidth;
		let xRepeat = Math.floor(xFracNat);
		xFrac -= xRepeat;
		xFracNat -= xRepeat;
		
		let yFracNat = (destHeight-yPixelOffset) / cellHeight;
		let yFrac = (destHeight / cellHeight);
		let yRepeat = Math.floor(yFracNat);
		yFrac -= yRepeat;
		yFracNat -= yRepeat;
		
		for(let y = 0; y < yRepeat; y++)
		{		
			TiledSpriteRendererSystem.DrawHorizontalOffsetSlice(context, image, y,
										srcX, srcY, srcWidth, srcHeight, 
										destX, destY, destWidth, cellHeight,
										xScale, yScale, xOffset, yOffset,
										xPixelOffset, yPixelOffset, xInversePixelOffset, yInversePixelOffset,
										cellWidth, cellHeight, xFracNat, xFrac, xRepeat);
		}
		
		
		//is render area greater than fractional portion?
		if(yRepeat > 0)//destHeight > yFrac*cellHeight-yPixelOffset)
		{
			//TOP SIDE
			TiledSpriteRendererSystem.DrawHorizontalOffsetSlice(context, image, 0,
										srcX, srcY+(yInversePixelOffset/yScale), srcWidth, srcHeight, 
										destX, destY, destWidth, cellHeight,
										xScale, yScale, xOffset, yOffset,
										xPixelOffset, 0, xInversePixelOffset, yInversePixelOffset,
										cellWidth, cellHeight, xFracNat, xFrac, xRepeat);
			
		
			//BOTTOM SIDE
			TiledSpriteRendererSystem.DrawHorizontalOffsetSlice(context, image, yRepeat,
										srcX, srcY, srcWidth, yFrac*srcHeight-(yOffset*srcWidth), 
										destX, destY, destWidth, yFrac*cellHeight-yPixelOffset, 
										xScale, yScale, xOffset, yOffset,
										xPixelOffset, yPixelOffset, xInversePixelOffset, yInversePixelOffset,
										cellWidth, cellHeight, xFracNat, xFrac, xRepeat);
		}
		else
		{
			
			//TOP SIDE
			TiledSpriteRendererSystem.DrawHorizontalOffsetSlice(context, image, 0,
									srcX, srcY+(yInversePixelOffset/yScale), srcWidth, destHeight/yScale,
									destX, destY, destWidth, destHeight,
									xScale, yScale, xOffset, yOffset,
									xPixelOffset, 0, xInversePixelOffset, yInversePixelOffset,
									cellWidth, cellHeight, xFracNat, xFrac, xRepeat);
			if(destHeight > yFrac*cellHeight-yPixelOffset)
			{
				//BOTTOM SIDE
				TiledSpriteRendererSystem.DrawHorizontalOffsetSlice(context, image, yRepeat,
										srcX, srcY, srcWidth, yFrac*srcHeight-(yOffset*srcWidth), 
										destX, destY, destWidth, yFrac*cellHeight-yPixelOffset, 
										xScale, yScale, xOffset, yOffset,
										xPixelOffset, yPixelOffset, xInversePixelOffset, yInversePixelOffset,
										cellWidth, cellHeight, xFracNat, xFrac, xRepeat);
			}
		}
			
	}
	
	/// 
	/// Helper for drawing a horizontal slice of a tiled image region with texture offsets.
	/// 
	static DrawHorizontalOffsetSlice(context, image, y, srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight, xScale, yScale, xOffset, yOffset,
			xPixelOffset, yPixelOffset, xInversePixelOffset, yInversePixelOffset, cellWidth, cellHeight, xFracNat, xFrac, xRepeat)
	{
		for(let x = 0; x < xRepeat; x++)
		{
			context.drawImage(image, srcX, srcY, srcWidth, srcHeight, 
							xPixelOffset + destX+(x*cellWidth), yPixelOffset + destY+(y*cellHeight),
							cellWidth, destHeight);
		}
		
		if(xRepeat > 0)//destWidth > xFrac*cellWidth-xPixelOffset)
		{
			//LEFT SIDE - KEEP THIS!!!
			context.drawImage(image, srcX+(xInversePixelOffset/xScale), srcY, xPixelOffset/xScale, srcHeight, 
						destX, yPixelOffset+destY+(y*cellHeight),
						xPixelOffset, destHeight);
			
			//RIGHT SIDE
			context.drawImage(image, srcX, srcY, xFrac*srcWidth-(xOffset*srcWidth), srcHeight, 
						xPixelOffset + destX+(xRepeat*cellWidth), yPixelOffset+destY+(y*cellHeight),
						xFrac*cellWidth-xPixelOffset, destHeight);
		}
		else
		{
			//LESS THAN THE FRACTIONAL PART!
			context.drawImage(image, srcX+(xInversePixelOffset/xScale), srcY, destWidth/xScale, srcHeight, 
						destX, yPixelOffset+destY+(y*cellHeight),
						destWidth, destHeight);
			if(destWidth > xFrac*cellWidth-xPixelOffset)
			{
				//RIGHT SIDE
				context.drawImage(image, srcX, srcY, xFrac*srcWidth-(xOffset*srcWidth), srcHeight, 
							xPixelOffset + destX+(xRepeat*cellWidth), yPixelOffset+destY+(y*cellHeight),
							xFrac*cellWidth-xPixelOffset, destHeight);
			}
			
		}
	}
	
	/// 
	/// Draws a simple tiled-image within a given region of the screen. This version does not support tiling offsets but will
	/// perform much faster in most cases.
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
								xFrac*cellWidth, cellHeight);
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
								xFrac*cellWidth, yFrac*cellHeight);
			}
		}
	}
	
}