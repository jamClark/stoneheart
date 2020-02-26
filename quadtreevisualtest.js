import {QuadTree, QuadNode} from './core/quadtree.js';
import Rect from './core/rect.js';
import Vector2 from './core/vector2.js';

let Tree = null;
let Canvas = null;

export function TestStart(canvas)
{
	Tree = new QuadTree(new Rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height), 4);
	Canvas = canvas;
	
	const ItemCount = 20;
	for(let i = 0; i < ItemCount; i++)
	{
		let xPos = 6 + (Math.random()*(Canvas.width-12));
		let yPos = 6 + (Math.random()*(Canvas.height-12));
		Tree.InsertItem(new Rect(xPos, yPos, 6, 6), new Vector2(xPos, yPos));
	}
	
	//let x = 50;
	//let y = 150;
	//Tree.InsertItem(new Rect(x, y, 30, 200), new Vector2(x, y));
	
	let list = Tree.RetrieveAll();
	if(list.length != ItemCount)
		console.log("Item count is incorrect! Should be " + ItemCount + " but is " + list.length + ".");
	else console.log("Item count is correct.");
	
	Repaint();
	window.requestAnimationFrame(loop);
	document.body.onmousedown = () => { MouseDown = true; }
	document.body.onmouseup = () => { MouseDown = false; }
	document.onmousemove = (evt) =>
	{
		if(MouseDown)
		{
			xMouse = evt.clientX;
			yMouse = evt.clientY;
		}
	}
}

function loop(timeStamp)
{
	Repaint();	
	window.requestAnimationFrame(loop);
}

let MouseDown = false;
let xMouse = 60;
let yMouse = 60;
function Repaint()
{
	let ctx = Canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, Canvas.width, Canvas.height);
	
	Tree.DebugDrawTree(Canvas, "white");
	const rect = new Rect(xMouse, yMouse, 120, 120);
	Tree.DebugDrawHilighted(Canvas, rect, "green");
}

