import Vector2 from './vector2.js';

/// 
/// 
/// 
export default class Rect
{
	#xPos;
	#yPos;
	#width;
	#height;
	
	constructor(x = 0, y = 0, width = 1, height = 1)
	{
		if(x instanceof Rect)
		{
			let p = x.Center;
			this.#xPos = p.x;
			this.#yPos = p.y;
			this.#width = x.#width;
			this.#height = x.#height;
		}
		else if(typeof x == "number")
		{
			this.#xPos = x;
			this.#yPos = y;
			this.#width = width;
			this.#height = height;
		}
		else throw new Error("Invalid param type");
	}
	
	get toString()
	{
		return "Rect ("+this.Top+","+this.Left+","+this.Bottom+","+this.Right+")";
	}
	
	///
	/// Creates and returns a new Rect with the given bounds.
	/// 
	static FromBounds(left, top, right, bottom)
	{
		let width = right - left;
		let height = top - bottom;
		return new Rect(left + (width*0.5), bottom + (height*0.5), width, height);
	}
	
	get xPos() { return this.#xPos; }
	get yPos () { return this.#yPos; }
	
	get Center()
	{
		return new Vector2(this.#xPos, this.#yPos);
	}
	
	set Center(pos)
	{
		this.#xPos = pos.x;
		this.#yPos = pos.y;
	}
	
	get Width()
	{
		return this.#width;
	}
	
	set Width(value) { this.#width = value; }
	
	get Height()
	{
		return this.#height;
	}
	
	set Height(value) { this.#height = value; }
	
	get Top()
	{
		return this.#yPos + (this.#height * 0.5);
	}
	
	get Left()
	{
		return this.#xPos - (this.#width * 0.5);
	}
	
	get Bottom()
	{
		return this.#yPos - (this.#height * 0.5);
	}
	
	get Right()
	{
		return this.#xPos + (this.#width * 0.5);
	}
	
	get TopLeft() { return new Vector2(this.Left, this.Top); }
	get TopRight() { return new Vector2(this.Right, this.Top); }
	get BottomLeft() { return new Vector2(this.Left, this.Bottom); }
	get BottomRight() { return new Vector2(this.Right, this.Bottom); }
	get Min() { return new Vector2(this.Bottom, this.Left); }
	get Max(){ return new Vector2(this.Top, this.Right); }
	
	/// 
	/// Increases this rect's width and height by the given amount.
	/// 
	ExpandSize(x, y)
	{
		this.#width += x;
		this.#height += y;
	}
	
	SetLeft(newLeft)
	{
		let diff = newLeft - this.Left;
		this.#width = this.Right - newLeft;
		this.#xPos += diff * 0.5;
	}
	
	SetRight(newRight)
	{
		let diff = newRight - this.Right;
		this.#width = newRight - this.Left;
		this.#xPos += diff * 0.5;
	}
	
	SetTop(newTop)
	{
		let diff = newTop - this.Top;
		this.#height = newTop - this.Bottom;
		this.#yPos += diff * 0.5;
	}
	
	SetBottom(newBottom)
	{
		let diff = newBottom - this.Bottom;
		this.#height = this.Top - newBottom;
		this.#yPos += diff * 0.5;
	}
	
	/// 
	/// Grows the bounds of this Rect to include the given one. This can cause this
	/// Rect's center position to shift as a result.
	/// 
	Encapsulate(rect)
	{
		this.SetLeft(Math.min(this.Left, rect.Left));
		this.SetRight(Math.max(this.Right, rect.Right));
		this.SetTop(Math.max(this.Top, rect.Top));
		this.SetBottom(Math.min(this.Bottom, rect.Bottom));
	}
	
	/// 
	/// Returns true if another point or Rect is overlapping this one.
	/// 
	IsOverlapping(other)
	{
		if(other instanceof Rect)
		{
			return (other.Left < this.Right && other.Right > this.Left &&
			        other.Bottom < this.Top && other.Top > this.Bottom);
		}
		else if(other instanceof Vector2)
		{
			return (other.x < this.Right && other.x > this.Left &&
					other.y < this.Top && other.y > this.Bottom);
		}
		else throw new Error("Invalid param type.");
		
	}
	
	/// 
	/// Returns true if this Rect fully contains another.
	/// 
	FullyContains(other)
	{
		return (other.Left > this.Left && other.Right < this.Right &&
				other.Bottom > this.Bottom && other.Top < this.Top);
	}
	
	/// 
	/// Returns the closest corner of this rect to the given point.
	/// 
	ClosestCorner(p)
	{
		return new Vector2(p.x < this.#xPos ? this.Left : this.Right,
						   p.y < this.#yPos ? this.Bottom : this.Top);
	}
}
