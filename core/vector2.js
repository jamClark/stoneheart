
/// 
/// 
/// 
export default class Vector2
{
	constructor(x = 0, y = 0)
	{
		if(x instanceof Vector2 || typeof x === 'object')
		{
			this.x = x.x;
			this.y = x.y;
		}
		else
		{
			this.x = x;
			this.y = y;
		}
	}
	
	static get Zero() { return new Vector2(0, 0); }
	static get Up() { return new Vector2(0, 1); }
	static get Down() { return new Vector2(0, -1); }
	static get Left() { return new Vector2(-1, 0); }
	static get Right() { return new Vector2(1, 0); }	
	static Distance(v1, v2) { return v2.Sub(v1).Mag; }
	
	/// 
	/// Fast way of calculating angle between two vectors.
	/// As a bonus it Returns a value between -180 and 180 which
	/// allows one to determine which side the 'to' angle was on
	/// without requiring an additional cross product!
	/// 
	static FastAngle(from, to)
	{
		let a = Math.atan2(from.y, from.x) * Mathf.Rad2Deg;
		let b = Math.atan2(to.y, to.x) * Mathf.Rad2Deg;
		//find smallest angle between two
		a = a - b;
		a += (a > 180) ? -360 : (a < -180) ? 360 : 0;
		return a;
		//return Mathf.DeltaAngle(a, b);
	}
	
	get SqrMag()
	{
		return (this.x * this.x) + (this.y * this.y);
	}
	
	get Mag()
	{
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	}
	
	get Inv() { return new Vector2(-this.x, - this.y); }
	
	///
	/// Adds the input to the first and returns a new vector.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Add(x = 0, y = 0)
	{
		if(x instanceof Vector2)
			return new Vector2(this.x + x.x, this.y + x.y);
		else return new Vector2(this.x + x, this.y + y);
	}
	
	///
	/// Adds the input to the first and stores the result in this vector.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Sum(x = 0, y = 0)
	{
		if(x instanceof Vector2)
		{
			this.x += x.x;
			this.y += x.y;
		}
		else
		{
			this.x += x;
			this.y += y;
		}
		return this;
	}
	
	///
	/// Substracts the input from the first.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Sub(x = 0, y = 0)
	{
		if(x instanceof Vector2)
			return new Vector2(this.x - x.x, this.y - x.y);
		else return new Vector2(this.x - x, this.y - y);
	}
	
	/// 
	/// Scales one vector by another and returns a new vector.
	/// If only a single value is supplied it is used for both axes.
	/// If two values or a Vector2 are supplied
	/// a component-wise scale is performed instead.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Mul(x = 1, y)
	{
		if(x instanceof Vector2)
			return new Vector2(this.x * x.x, this.y * x.y);
		else if(y === undefined)
			return new Vector2(this.x * x, this.y * x);
		else return new Vector2(this.x * x, this.y * y);
	}
	
	/// 
	/// Scales one vector by another and returns a new vector.
	/// If only a single value is supplied it is used for both axes.
	/// If two values or a Vector2 are supplied
	/// a component-wise scale is performed instead.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Div(x = 1, y)
	{
		if(x instanceof Vector2)
			return new Vector2(this.x / x.x, this.y / x.y);
		else if(y === undefined)
			return new Vector2(this.x / x, this.y / x);
		else return new Vector2(this.x / x, this.y / y);
	}
	
	/// 
	/// Scales one vector by another and stores the result in this vector.
	///	If only a single value is supplied it is used for both axes.
	/// If two values or a Vector2 are supplied
	/// a component-wise scale is performed instead.
	/// Can accept invidual inputs or a single Vector2.
	/// 
	Scale(x = 1, y)
	{
		if(x instanceof Vector2)
		{
			this.x *= x.x;
			this.y *= x.y;
		}
		else if(y === undefined)
		{
			this.x *= x;
			this.y *= x;
		}
		else
		{
			this.x *= x;
			this.y *= y;
		}
		return this;
	}
	
	/// 
	/// Returns a new vector with the absolute value of each component of this vector.
	/// 
	Abs()
	{
		return new Vector2(Math.abs(this.x), Math.abs(this.y));
	}
	
	///
	/// Returns a new vector with each component being the max of this vector's components.
	/// 
	MaxComponent()
	{
		let highest = Math.max(this.x, this.y);
		return new Vector2(highest, highest);
	}
	
	///
	/// Returns a new vector with each component being the min of this vector's components.
	/// 
	MinComponent()
	{
		let lowest = Math.max(this.x, this.y);
		return new Vector2(lowest);
	}
	
	/// 
	/// Returns a new vector that has the max value for each component of either vector.
	/// 
	Max(vec)
	{
		return new Vector2(Math.max(this.x, vec.x), Math.max(this.y, vec.y));
	}
	
	/// 
	/// Returns a new vector that has the min value for each component of either vector.
	/// 
	Min(vec)
	{
		return new Vector2(Math.min(this.x, vec.x), Math.min(this.y, vec.y));
	}
		
	/// 
	/// 
	/// 
	Dot(vec)
	{
		return (this.x * vec.x) + (this.y * vec.y);
	}
	
	/// 
	/// 
	/// 
	Cross(v)
	{
		throw new Error("Not yet implemented");
	}
	
	get normalized() { return this.Div(this.Mag); }
	
	Normalize()
	{
		let temp = this.normalized;
		this.x = temp.x;
		this.y = temp.y;
	}
	
	/// 
	/// Returns true if two line segments intersect.
	/// 
	static LineSegmentsIntersect(line1point1, line1point2, line2point1, line2point2)
	{
		let a = line1point2.Sub(line1point1);
		let b = line2point1.Sub(line2point2);
		let c = line1point1.Sub(line2point1);
	 
		let alphaNumerator = b.y * c.x - b.x * c.y;
		let betaNumerator  = a.x * c.y - a.y * c.x;
		let denominator    = a.y * b.x - a.x * b.y;
	 
		if (denominator == 0)
			return false;
		else if (denominator > 0) 
		{
			if (alphaNumerator < 0 || alphaNumerator > denominator || betaNumerator < 0 || betaNumerator > denominator) 
			 return false;
		} 
		else if (alphaNumerator > 0 || alphaNumerator < denominator || betaNumerator > 0 || betaNumerator < denominator) 
			return false;
		
		return true;
	}
	
	/// 
	/// Returns the Vector2 location of the intersection point between two line
	/// segments or null if they do not intersect.
	/// 
	static IntersectionPoint(A1, A2, B1, B2)
	{
		if(!Vector2.LineSegmentsIntersect(A1, A2, B1, B2))
			return null;
		let tmp = (B2.x - B1.x) * (A2.y - A1.y) - (B2.y - B1.y) * (A2.x - A1.x);
	 
		if (tmp == 0)
			return null;
		
		let mu = ((A1.x - B1.x) * (A2.y - A1.y) - (A1.y - B1.y) * (A2.x - A1.x)) / tmp;
		
		return new Vector2(
			B1.x + (B2.x - B1.x) * mu,
			B1.y + (B2.y - B1.y) * mu
		);
	}
}