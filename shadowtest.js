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
	
	
	
	
	console.log("\n---- Testing Immutable Linked Prop ----");
	let b = new Bar(10, 20);
	console.log("V.X: " + v1.x + "  Linked X: " + LinkedX);
	ShadowImmutableMember(v1, "position.x", (value) => {LinkedX = value;});
	
	v1.x = 10;
	console.log("V.X: " + v1.x + "  Linked X: " + LinkedX);
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

/// 
/// Removes a previously linked member and restores it to its previous state.
/// 
function RemoveMemberShadow(foo, propName)
{
	let prop = foo[`_OVERRIDENPROP_${propName}`];
	let field = foo[`_OVERRIDENFIELD_${propName}`];
	
	if(prop != null)
	{
		Object.defineProperty(foo, propName,
		{
			configurable: true,
			enumerable: true,
			get: prop.get.bind(foo),
			set: prop.set.bind(foo),
		});
	}
	else if(field != null)
	{
		delete foo[propName];
		foo[propName] = field;
	}
	else throw new Error(`This object has not had its '${propName}' member overriden.`);
}

/// 
/// Creates a shadow of an object's member that invokes a specified callback
/// each time its value is set.
/// 
function ShadowMember(foo, propName, callback)
{
	let prop = Object.getOwnPropertyDescriptor(foo.__proto__, propName);
	if(prop == null)
	{
		if(foo[propName] === undefined)
			throw new Error(`The field ${propName} is not defined on the give object.`);
		else foo["_OVERRIDENFIELD_" + propName] = foo[propName];
	}
	else foo[`_OVERRIDENPROP_${propName}`] = prop;
	
	
	Object.defineProperty(foo, propName, 
	{
		configurable: true,
		enumerable: true,
		get: function()
		{
			return this[`_OVERRIDENPROP_${propName}`] == null ? foo[`_OVERRIDENFIELD_${propName}`] : this[`_OVERRIDENPROP_${propName}`].get.call(foo);
		},
		set: function(value)
		{
			if(this[`_OVERRIDENPROP_${propName}`] == null)
				this[`_OVERRIDENFIELD_${propName}`] = value;
			else this[`_OVERRIDENPROP_${propName}`].set.call(foo, value);
			callback(value);
		}
	});
	
	//this jumpstarts the link by ensuring the callback is invoked
	foo[propName] = foo[propName];
}


