import Vector2 from './core/vector2.js'
import {ShadowMember, RemoveMemberShadow } from './core/utility.js';

class Foo
{
	#InnerWidth = 10;
	
	constructor()
	{
		this.PublicValue = 55;
	}
	
	get Width() { return this.#InnerWidth; }
	set Width(value) { this.#InnerWidth = value; }
}

/// 
/// 
/// 
class Bar
{
	#Pos;
	
	constructor(x, y)
	{
		this.#Pos = new Vector2(x, y);
	}
	
	get Position()
	{
		return new Vector2(this.#Pos);
	}
	
	set Position(pos)
	{
		this.#Pos = new Vector2(pos);
	}
}

/// 
/// 
/// 
export function Main()
{
	let f = new Foo();
	console.log("Public Value: " + f.PublicValue);
	console.log("Width: " + f.Width);
	
	console.log("\n---- Testing Linked Field ----");
	console.log("ORIGINAL FIELD: " + f.PublicValue + "   LINKED: " + LinkedField);
	ShadowMember(f, 'PublicValue', LinkField);
	console.log("ORIGINAL FIELD: " + f.PublicValue + "   LINKED: " + LinkedField);
	
	f.PublicValue = 103;
	console.log("ORIGINAL FIELD: " + f.PublicValue + "   LINKED: " + LinkedField);
	RemoveMemberShadow(f, 'PublicValue');
	f.PublicValue = 99;
	console.log("ORIGINAL FIELD: " + f.PublicValue + "   LINKED: " + LinkedField);
	
	console.log("\n---- Testing Linked Prop ----");
	console.log("ORIGINAL PROP: " + f.Width + "   LINKED: " + LinkedProp);
	ShadowMember(f, 'Width', LinkProp);
	console.log("ORIGINAL PROP: " + f.Width + "   LINKED: " + LinkedProp);
	
	f.Width = 61;
	console.log("ORIGINAL PROP: " + f.Width + "   LINKED: " + LinkedProp);
	RemoveMemberShadow(f, 'Width');
	f.Width = 93;
	console.log("ORIGINAL PROP: " + f.Width + "   LINKED: " + LinkedProp);
	
	
}

let LinkedX = -1;


let LinkedField = 0;
function LinkField(val)
{
	LinkedField = val;
}

let LinkedProp = 0;
function LinkProp(val)
{
	LinkedProp = val;
}


