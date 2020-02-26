import Vector2 from './vector2.js';
import Rect from './rect.js';

//If set, when items overlap multiple nodes they become assigned to the root of all overlapped nodes, otheriwse
//a duplicate reference is stored in each node in which they overlap.
const ParentIfUnbound = false;

//If duplicate references to a sngle item are returned when retreiving results, they will be culled. Setting this
//to false may help performance but will require manual culling of duplicates if required.
const CullDuplicateRetreival = false;


/// 
/// Spacial partitioning system as a 2D quad-tree.
/// 
/// TODO: InsertItem needs to have a way to resize and rebuild the entire tree if
/// 	  something is entered that is out of bounds.
/// 
/// TODO: Implemented Unsubdivide for Nodes.
///
/// TODO: Need a way to remove items from tree.
///
/// TODO: Need a way to move items around in tree (currently requires rebuilding the entire tree)
///
/// IMPORTANT: Currently, any items that are not fully contained in a Node are stored in the parent instead.
///            This can massively reduce the efficency of checking for AABB collisions due to the fact that
///			   these items in the parent have no upper limit to storage count and must all be checked even
///			   when we are only interested in a particular child quadrant.
/// 
export class QuadTree
{
	#Root;
	#Bounds;
	
	constructor(bounds, maxItems)
	{
		if(!(bounds instanceof Rect))
			throw new Error("Bounds passed to a QuadTree must be of type 'Rect'.");
		
		this.#Bounds = new Rect(bounds);
		this.#Root = new QuadNode(null, bounds, maxItems);
	}
	
	get Root() { return this.#Root; }
	get Bounds() { return new Rect(this.#Bounds); }
	
	/// 
	/// Helper for drawing nodes.
	/// 
	DebugDrawTree(canvas, color = 'white')
	{
		let ctx = canvas.getContext('2d');
		
		this.DebugDrawNode(canvas, this.#Root, color);
	}
	
	/// 
	/// 
	/// 
	DebugDrawHilighted(canvas, bounds, color = "green")
	{
		let ctx = canvas.getContext('2d');
		ctx.beginPath();
		canvas.getContext('2d').rect(bounds.Left, bounds.Top, bounds.Width, -bounds.Height);
		ctx.strokeStyle = "yellow";
		ctx.stroke();
		ctx.closePath();
		
		let items = this.RetrieveInBounds(bounds);
		console.log("Items Found Inside Bounds: " + ((items == null) ? 0 : items.length));
		if(items != null)
		{
			for(let item of items)
				this.DrawItem(canvas, item, color);
		}
	}
	
	/// 
	/// Helper method for recursively drawing a node and all of it's children.
	/// 
	DebugDrawNode(canvas, node, color = 'white')
	{
		let r = node.Bounds;
		let ctx = canvas.getContext('2d');
		ctx.beginPath();
		canvas.getContext('2d').rect(r.Left, r.Top, r.Width, -r.Height);
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.closePath();
		
		//NOTE: Item is stored as [Rect, <actual item data>]
		for(let item of node.Items)
			this.DrawItem(canvas, item);
		
		if(node.Children != null)
		{
			for(let c of node.Children)
				this.DebugDrawNode(canvas, c, color);
		}
	}
	
	/// 
	/// 
	/// 
	DrawItem(canvas, item, color = "red")
	{
		let ctx = canvas.getContext('2d');
		let pos = item[0].Center;
		let rect = item[0];
		
		ctx.beginPath();
		//canvas.getContext('2d').rect(pos.x-4, pos.y-4, 8, 8);
		canvas.getContext('2d').rect(pos.x - (rect.Width*0.5), pos.y - (rect.Height*0.5), rect.Width, rect.Height);
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.closePath();
	}
	
	/// 
	/// Updates the internal bounds to contain all inserted AABBs.
	/// 
	UpdateBounds()
	{
		throw new Error("Not yet implemented");
	}
	
	/// 
	/// 
	/// 
	InsertItem(bounds, item)
	{
		if(!(bounds instanceof Rect))
			throw new Error("First parameter must be of type Rect");
		
		let deepest = this.Root.GetDeepestContainingNode(bounds);
		if(deepest != null)
		{
			deepest.Store(bounds, item);
		}
		//if nothing fully contains the bounds it means the bounds are at 
		//least partially outside of the world space and we need to update them
		else
		{
			console.log("Storing item in root due to exceeding current boundary limits.");
			//TODO: update max bound space and rebuild the tree.
			let result = this.Root.Store(bounds, item);
			if(result == null)
				throw new Error("Tried to store an item that does not in any way fit within the bounds of the tree!");
		}
	}
	
	/// 
	/// Returns a list of all items within this tree.
	/// 
	RetrieveAll()
	{
		return this.Root.RetrieveAll(true);
	}
	
	/// 
	/// Returns a list of all items within the given AABB or null if nothing is found.
	/// 
	RetrieveInBounds(bounds)
	{
		return this.Root.RetrieveInBounds(bounds);
	}
	
}



/// 
/// 
/// 
export class QuadNode
{
	constructor(root, bounds, maxItems)
	{
		if(!(root instanceof QuadNode) && root != null)
			throw new Error("Invalid parent node type. Must be QuadNode or null");
		this.Root = root;
		this.Bounds = new Rect(bounds);
		this.MaxItems = maxItems;
		this.Items = [];
		this.Children = null;
	}
	
	/// 
	/// Removes the given item from this node. Can optionally search
	/// children and remove it from them.
	/// 
	Remove(item, includeChildren = false)
	{
		//TODO: we need to consider the fact that items are now an array 
		throw new Error("Need to be updated to account for new item storage format");
		/*
		let i = this.Items.indexOf(item);
		if(i >= 0)
		{
			return true;
		}
		else if(includeChildren)
		{
			for(let c = 0; c < this.Items.length; c++)
			{
				if(this.Items.Children[c].Remove(item, true))
					return true;
			}
		}
		
		return false;
		*/
	}
	
	/// 
	/// Removes all items from this node and optionally its children too, if any.
	/// 
	ClearAll(includeChildren = false)
	{
		this.Items = [];
		if(includeChildren)
		{
			for(let c = 0; c < this.Items.length; c++)
				this.Items.Children[c].Items = [];
		}
		
	}
	
	/// 
	/// Retrieves a list of all items stored within this node.
	/// Can optionally search children recursively as well.
	/// 
	RetrieveAll(includeChildren = false)
	{
		let list = [];
		list = list.concat(this.Items);
		if(includeChildren && this.Children != null)
		{
			for(let child of this.Children)
				list = list.concat(child.RetrieveAll(true));
		}
		
		return list;
	}
	
	/// 
	/// Returns a list of all items stored within the given AABB or null if nothing is found.
	/// 
	RetrieveInBounds(bounds)
	{
		let list = [];
		
		if(!this.Bounds.IsOverlapping(bounds))
			return null;
		for(let item of this.Items)
		{
			if(item[0].IsOverlapping(bounds))
				list.push(item);
		}
		
		if(this.Children != null)
		{
			for(let child of this.Children)
			{
				let temp = child.RetrieveInBounds(bounds);
				//TODO: we need to filter out duplicates that may occur due to storing the same
				//item in multiple children when it overlaps boundaries
				if(temp != null)
					list = list.concat(temp);
			}
		}
		
		return list.length > 0 ? list : null;
	}
	
	/// 
	/// Stores an item in this node. If the node is full,
	/// it is subdivided and the child is store in there instead.
	/// Returns a reference to the node that the item was stored in.
	/// 
	Store(bounds, item)
	{ 
		if(ParentIfUnbound)
		{
			//places items into the parent if no children full contain them
			if(!this.Bounds.FullyContains(bounds))
				return null;
			
			if(this.Items.length >= this.MaxItems)
			{
				if(this.Children == null)
					this.Subdivide();
				
				//look for a child that fully contains the bounds
				for(let child of this.Children)
				{
					let destNode = child.Store(bounds, item);
					if(destNode != null)
						return destNode;
				}
			}
			
			//store here if either A) we have not reached max items or 
			//B) none of the children fully contain the item
			this.Items.push([bounds, item]);
			return this;
		}
		else
		{
			//places duplicates in each child that is overlapped - these will need to be filtered out when retreiving
			if(!this.Bounds.IsOverlapping(bounds))
				return null;
			
			let destList = [];
			//NOTE: This will return an array of nodes if multiple contain the item
			if(this.Items.length >= this.MaxItems)
			{
				if(this.Children == null)
					this.Subdivide();
				
				//look for a child that fully contains the bounds
				for(let child of this.Children)
				{
					let destNode = child.Store(bounds, item);
					if(destNode != null)
					{
						if(Array.isArray(destNode))
							destList = destList.concat(destNode);
						else destList.push(destNode);
					}
				}
				
				if(destList.length > 1)
					return destList;
				else if(destList.length == 1)
					return destList[0];
				else throw new Error("Dest list for storing an overlapping item is empty. This should not happen.");
			}
			
			//store here if we have not reached max items
			this.Items.push([bounds, item]);
			return this;
		}
	}
	
	/// 
	/// 
	/// 
	Subdivide()
	{
		this.Children = [];
		
		//children defined as left to right, top to bottom
		this.Children.push(new QuadNode(this, Rect.FromBounds(this.Bounds.Left, this.Bounds.Top, this.Bounds.Center.x, this.Bounds.Center.y), this.MaxItems));
		this.Children.push(new QuadNode(this, Rect.FromBounds(this.Bounds.Center.x, this.Bounds.Top, this.Bounds.Right, this.Bounds.Center.y), this.MaxItems));
		this.Children.push(new QuadNode(this, Rect.FromBounds(this.Bounds.Left, this.Bounds.Center.y, this.Bounds.Center.x, this.Bounds.Bottom), this.MaxItems));
		this.Children.push(new QuadNode(this, Rect.FromBounds(this.Bounds.Center.x, this.Bounds.Center.y, this.Bounds.Right, this.Bounds.Bottom), this.MaxItems));
		
		//move items into children that fully contain them
		let retained = [];
		for(let item of this.Items)
		{
			let continueOutter = false;
			for(let child of this.Children)
			{
				//TODO: we need to store the original item bounds here because
				//it's needed when moving it into a child node
				let destNode = child.Store(item[0], item[1]);
				if(destNode != null)
				{
					continueOutter = true;
					continue;
				}
			}
			if(continueOutter)
				continue;
			//the item wasn't fully contained by any children, we'll retain it for this node.
			retained.push(item);
		}
		
		//reset local items list
		this.Items = retained;
	}
	
	/// 
	/// Helper method for un-subdividing a node. Returns true if the operation was successful.
	/// False is returned if a child of this node has children of its own.
	/// 
	Undivide()
	{
		//TODO: If any of our children have children, this operation need to cancel
		throw new Error("Not yet implemented");
	}
	
	/// 
	/// Searches for the deepest node that fully contains the given bounds.
	/// 
	GetDeepestContainingNode(bounds)
	{
		if(this.Children != null)
		{
			for(let child of this.Children)
			{
				let container = child.GetDeepestContainingNode(bounds);
				if(container != null)
					return container;
			}
		}
		else if(this.Bounds.FullyContains(bounds))
			return this;
				
		return null;
	}
}
