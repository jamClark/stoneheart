import {SearchPropertyContainer, ShadowMember, RemoveMemberShadow} from './../core/utility.js'
import Vector2 from './../core/vector2.js';
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
	static DrawBoolField(parentDiv, obj, property, label)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.type = "checkbox";
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "checked", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawFloatField(parentDiv, obj, property, label, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		inputElm.inputmode = "numeric";
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawIntField(parentDiv, obj, property, label, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		inputElm.inputmode = "number";
		inputElm.step = "1";
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// 
	/// 
	static DrawStringField(parentDiv, obj, property, label, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('input');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		inputElm.value = obj[property];
		
		return Editor.Bind(inputElm, "oninput", "value", obj, property);
	}
	
	/// 
	/// HACK ALERT: DrawAssetDropdown accesses images directly without the use of promises so it 
	///				is essential that all images that will be displayed in the dropdown list are
	///				loaded ahead of time.
	/// 
	static DrawAssetDropdown(parentDiv, obj, property, label, list, assetMan, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
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
					//HACK ALERT: We can't load resources here! They *must* already exist in the AssetManager for this to work!!
					//ELEMENT-TO-PROP
					return assetMan.GetDirectResource(list[value]);
				},
				(value) =>
				{
					let index = list.indexOf(value.srcPath);
					return index > -1 ? index : 0;
				});
	}
	
	/// 
	/// 
	/// 
	static DrawListDropdown(parentDiv, obj, property, label, list, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
		for(let e of list)
		{
			let option = document.createElement('option');
			option.innerHTML = e;
			option.value = e;
			inputElm.appendChild(option);
		}
		
		let actualValue = obj[property];
		console.log("ACTUAL: " + actualValue);
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
	static DrawEnumDropdown(parentDiv, obj, property, label, enumSet, inputWidth)
	{
		let inputDiv = document.createElement('div');
		let titleElm = document.createElement('label');
		let inputElm = document.createElement('select');
		let lineBreakDiv = document.createElement('div');
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(inputElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px";
		
		
		inputElm.style = `width:${inputWidth?inputWidth:100}px;`;
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
	static DrawHeader(parentDiv, text)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `<b>${text}</b>`;
		titleElm.className = 'InspectorHeader';
		titleElm.style = "font-size: 1.1rem; padding-bottom: 2px; display:block;";
		parentDiv.appendChild(titleElm);
	}
	
	/// 
	/// 
	/// 
	static DrawLabel(parentDiv, text)
	{
		let titleElm = document.createElement('label');
		titleElm.innerHTML = `${text}`;
		titleElm.className = 'InspectorLabel';
		titleElm.style = "padding-right: 5px; display:block;";
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
		lineBreakDiv.class = "InspectorLineBreak";
		inputDiv.appendChild(titleElm);
		inputDiv.appendChild(xElm);
		inputDiv.appendChild(yElm);
		parentDiv.appendChild(inputDiv);
		parentDiv.appendChild(lineBreakDiv);
		
		inputDiv.className = 'InspectorElementDiv';
		
		titleElm.innerHTML = `${label}:`;
		titleElm.className = 'InspectorLabel';
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