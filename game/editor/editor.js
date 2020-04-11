import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../../core/utility.js'
import Vector2 from './../../core/vector2.js';
/// 
/// Utility class that provides static functions for drawing editor
/// controls and bind their data to data sources.
/// 
export default class Editor
{
	/// 
	/// Sets up a one-way binding between the obj's property and an HTML's inner text.
	/// An optional converter functions may be passed to perform data conversion between
	/// the linked HTML element and it's bound backing property. By default, no conversion takes place.
	/// 
	static BindHTML(element, obj, property, propToElmConverter = Editor.PassThroughConverter)
	{
		ShadowMember(obj, property, (value) => { element.innerHTML = propToElmConverter(value); });
		return [obj, property];
	}
	
	/// 
	/// Sets up a two-way binding between the obj's property and an HTML element value.
	/// Two optional converter functions may be passed to perform data conversion between
	/// the linked HTML element and it's bound backing property. If one converter supplied,
	/// both should be supplied. By default, no conversion takes place.
	/// 
	static Bind(element, eventName, elementValue, obj, property, elmToPropConverter = Editor.PassThroughConverter, propToElmConverter = Editor.PassThroughConverter)
	{
		element[eventName] = () => obj[property] = elmToPropConverter(element[elementValue]);
		ShadowMember(obj, property, (value) => { element[elementValue] = propToElmConverter(value); });
		return [obj, property];
	}
	
	/// 
	/// Specific binding helper for handling a complex HTML element that represents a Vector2.
	/// 
	static BindVector2(xElm, yElm, eventName, elementValue, obj, property)
	{
		xElm[eventName] = () => obj[property] = new Vector2(parseFloat(xElm[elementValue]), obj[property].y);
		yElm[eventName] = () => obj[property] = new Vector2(obj[property].x, parseFloat(yElm[elementValue]));
		
		ShadowMember(obj, property, (value) =>
		{ 
			xElm[elementValue] = value.x; 
			yElm[elementValue] = value.y;
		});
		
		return [obj, property];
	}
	
	/// 
	/// Default binding converter. Simply returns the input value unchanged.
	/// 
	static PassThroughConverter(value)
	{
		return value;
	}
	
	/// 
	/// 
	/// 
	static DrawEntityRefField(parentDiv, obj, property, label, styleOptions)
	{
	}
	
	/// 
	/// 
	/// 
	static DrawComponentRefField(parentDiv, obj, property, label, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('div');
		fieldRoot.appendChild(inputElm);
		
		let compRef = obj[property];
		//need to check if the entity is null just in case
		if(compRef == null || compRef.IsDestroyed)
		{
			inputElm.value 		= "null";
			inputElm.innerHTML 	= "null";
		}
		else
		{
			inputElm.value 		= compRef.Entity.GUID + ":"  + compRef.guid;
			inputElm.innerHTML 	= compRef.Entity.name + "->" + compRef.type;
		}
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		
		return Editor.Bind(inputElm, "changed", "value", obj, property,
			(value) =>
			{
				//elm-to-prop
				if(value == null || value.length < 1)
					return null;
				
				let guids = value.split(":");
				console.log("Seeking entity " + guids[0] + " with comp " + guids[1]);
				//TODO: seek out the entity/comp pair using the guids stored in the 'value' property
			},
			(value) =>
			{
				//prop-to-elm
				let compRef = value;
				let guidValue = "null";
				if(compRef == null || compRef.IsDestroyed)
				{
					guidValue			= "null";
					inputElm.innerHTML 	= "null";
				}
				else
				{
					guidValue 			= compRef.Entity.GUID + ":"  + compRef.guid;
					inputElm.innerHTML 	= compRef.Entity.name + "->" + compRef.type;
				}
				return guidValue;
			});
	}
	
	/// 
	/// 
	/// 
	static DrawButton(parentDiv, label, callback, styleId, styleOptions)
	{
		let inputDiv = document.createElement('div');
		let inputElm = document.createElement('button');
		parentDiv.appendChild(inputDiv);
		inputDiv.appendChild(inputElm);
		
		inputElm.innerHTML = label;
		inputElm.type = "button";
		inputElm.onclick = callback;
		inputElm.className = styleId;
		if(styleOptions)
			inputElm.style = styleOptions;
		
		return inputElm;
	}
	
	/// 
	/// 
	/// 
	static DrawPressable(parentDiv, label, styleId, callback, styleOptions)
	{
		let inputDiv = document.createElement('div');
		parentDiv.appendChild(inputDiv);
		
		inputDiv.innerHTML = label;
		inputDiv.type = "button";
		inputDiv.onclick = callback;
		inputDiv.className = styleId;
		if(styleOptions)
			inputDiv.style = styleOptions;
		
		return inputDiv;
	}
	
	/// 
	/// Base framework for drawing field controls.
	/// 
	static DrawBaseField(parentDiv, label, noBreak = false)
	{
		let inputDiv  = document.createElement('div');
		inputDiv.className = 'InspectorElementDiv';
		inputDiv.style = "width:90%; display:flex; flex-direction:row;";
		parentDiv.appendChild(inputDiv);
		
		if(!noBreak)
		{
			let lineBreakDiv = document.createElement('div');
			lineBreakDiv.class = "EditorLineBreak";
			parentDiv.appendChild(lineBreakDiv);
		}
		
		if(label != null && (typeof label === 'string') && label.length > 0)
		{
			let titleElm = document.createElement('label');
			titleElm.innerHTML = `${label}:`;
			titleElm.className = 'EditorLabel';
			titleElm.style = "padding-right: 5px";
			inputDiv.appendChild(titleElm);
		}
		
		return inputDiv;
	}
	
	/// 
	/// 
	/// 
	static DrawBoolField(parentDiv, obj, property, label, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('input');
		fieldRoot.appendChild(inputElm);
		
		inputElm.type = "checkbox";
		inputElm.value = obj[property];
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		
		return Editor.Bind(inputElm, "oninput", "checked", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawFloatField(parentDiv, obj, property, label, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('input');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		inputElm.inputmode = "numeric";
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawIntField(parentDiv, obj, property, label, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('input');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		inputElm.inputmode = "number";
		inputElm.step = "1";
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawStringField(parentDiv, obj, property, label, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('input');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// HACK ALERT: DrawAssetDropdown accesses images directly without the use of promises so it 
	///				is essential that all images that will be displayed in the dropdown list are
	///				loaded ahead of time.
	/// 
	static DrawAssetDropdown(parentDiv, obj, property, label, list, assetMan, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('select');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		for(let e of list)
		{
			let option = document.createElement('option');
			option.innerHTML = e;
			option.value = e;
			inputElm.appendChild(option);
		}
		
		let actualValue = obj[property];
		let index = list.indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		return Editor.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					if(value == null) return "";
					//HACK ALERT: We can't load resources here! They *must* already exist in the AssetManager for this to work!!
					//ELEMENT-TO-PROP
					return assetMan.GetDirectResource(list[value]);
				},
				(value) =>
				{
					if(value == null) return -1;
					let index = list.indexOf(value.srcPath);
					return index > -1 ? index : 0;
				});
	}
	
	/// 
	/// 
	/// 
	static DrawListDropdown(parentDiv, obj, property, label, list, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('select');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		for(let e of list)
		{
			let option = document.createElement('option');
			option.innerHTML = e;
			option.value = e;
			inputElm.appendChild(option);
		}
		
		let actualValue = obj[property];
		let index = list.indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		return Editor.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					//ELEMENT-TO-PROP
					return list[value];
				},
				(value) =>
				{
					//PROP-TO-ELEMENT
					let index = list.indexOf(value);
					return index > -1 ? index : 0;
				});
	}
		
	/// 
	/// 
	/// 
	static DrawEnumDropdown(parentDiv, obj, property, label, enumSet, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('select');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		for(let e of enumSet)
		{
			let option = document.createElement('option');
			option.innerHTML = e[0];
			option.value = e[1];
			inputElm.appendChild(option);
		}
		
		let index = enumSet.map(x => x[1]).indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		return Editor.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					//ELEMENT-TO-PROP
					return enumSet[value][1];
				},
				(value) =>
				{
					//PROP-TO-ELEMENT
					let index = enumSet.map(x => x[1]).indexOf(value);
					return index > -1 ? index : 0;
				});
	}
	
	/// 
	/// 
	/// 
	static DrawBitmaskDropdown(parentDiv, obj, property, label, enumSet, styleOptions)
	{
		let fieldRoot = this.DrawBaseField(parentDiv, label);
		let inputElm = document.createElement('select');
		fieldRoot.appendChild(inputElm);
		
		inputElm.style = "width:100%";
		if(styleOptions)
			inputElm.style = styleOptions;
		for(let e of enumSet)
		{
			let option = document.createElement('option');
			option.innerHTML = e[0];
			option.value = e[1];
			inputElm.appendChild(option);
		}
		
		let index = enumSet.map(x => x[1]).indexOf(obj[property]);
		inputElm.selectedIndex = index > -1 ? index : 0;
		
		return Editor.Bind(inputElm, "oninput", "selectedIndex", obj, property, 
				(value) => 
				{
					//ELEMENT-TO-PROP
					return enumSet[value][1];
				},
				(value) =>
				{
					//PROP-TO-ELEMENT
					let index = enumSet.map(x => x[1]).indexOf(value);
					return index > -1 ? index : 0;
				});
	}
	
	/// 
	/// 
	/// 
	static DrawHeader(parentDiv, text, styleOptions)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `<b>${text}</b>`;
		titleElm.className = 'EditorHeader';
		titleElm.style = "font-size: 1.1rem; padding-bottom: 2px; display:block;";
		if(styleOptions)
			titleElm.style = styleOptions;
		parentDiv.appendChild(titleElm);
	}
	
	/// 
	/// 
	/// 
	static DrawLabel(parentDiv, text, styleOptions)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `${text}`;
		titleElm.className = 'EditorLabel';
		titleElm.style = "padding-right: 5px; display:block;";
		if(styleOptions)
			titleElm.style = styleOptions;
		parentDiv.appendChild(titleElm);
	}
	
	/// 
	/// 
	/// 
	static DrawVector2Field(parentDiv, obj, property, label)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let xElm = document.createElement('input');
		let yElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "EditorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(xElm);
		inputDiv.appendChild(yElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'EditorLabel';
		titleElm.style = "padding-right: 5px";
		
		xElm.inputmode = "numeric";
		xElm.value = obj[property].x;
		xElm.style = "width:50px; margin-right: 5px"
		xElm.name = `${property}.x`;
		
		yElm.inputmode = "numeric";
		yElm.value = obj[property].y;
		yElm.style = "width:50px;"
		yElm.name = `${property}.x`;
		
		return Editor.BindVector2(xElm, yElm, "onchange", "value", obj, property);
	}
}