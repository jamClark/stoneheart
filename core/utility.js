
/// 
/// 
/// 
export function RandomRange(a, b)
{
	let min = Math.min(a, b);
	let max = Math.max(a, b);
	return (Math.random() * (max - min)) + min;
}

/// 
/// 
/// 
export function getAllGlobalSubclasses(baseClass)
{
  var globalObject = Function('return this')(); 
  var allVars = Object.keys(globalObject);
  var classes = allVars.filter(function (key) 
  {
	try 
	{
		var obj = globalObject[key];
        return obj.prototype instanceof baseClass;
	} 
	catch (e) 
	{
        return false;
    }
  });
  return classes;
}

/// 
/// Helper for seeking out a property and its container using dot notation.
/// Returns an array with the containing object reference and the name of the final
/// property itself.
///
/// For example given a nested object like obj.subObj.value, the call (obj, "subObj.value")
/// would return [subObj, "value"].
/// 
export function SearchPropertyContainer(obj, path)
{
	let splitPath = path.split('.');
	if(splitPath.length == 1) 
		return [obj, path];
	
	let curr = obj[splitPath[0]];
	let i = 0;
	for(; i < splitPath.length-2; i++)
		curr = curr[splitPath[i]];
	
	return [curr, splitPath[i+1]];
}

/// 
/// Returns true if the named property of a given object is 
/// currently overriden by a shadow.
/// 
export function IsShadowed(foo, propName)
{
	return 	typeof foo[`_OVERRIDENFIELD_${propName}`] != 'undefined' ||
			typeof foo[`_OVERRIDENPROP_${propName}`] != 'undefined';
}

/// 
/// Creates a shadow of an object's member that invokes a specified callback
/// each time its value is set.
/// 
export function ShadowMember(foo, propName, callback)
{
	//find out if we are shadowing a field or an accessor
	let prop = Object.getOwnPropertyDescriptor(foo.__proto__, propName);
	if(prop == null)
	{
		if(foo[propName] === undefined)
			throw new Error(`The field '${propName}' is not defined on the given object.`);
		else foo[`_OVERRIDENFIELD_${propName}`] = foo[propName];
	}
	else foo[`_OVERRIDENPROP_${propName}`] = prop;
	
	//init callback list if needed
	if(foo[`_SHADOWCALLBACKS_${propName}`] == null)
		foo[`_SHADOWCALLBACKS_${propName}`] = [];
	foo[`_SHADOWCALLBACKS_${propName}`].push(callback);
	
	//create a new accessor that shadows the old property
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
			
			for(let cb of foo[`_SHADOWCALLBACKS_${propName}`])
				cb(value);
		}
	});
	
	//this jumpstarts the link by ensuring the callbacks are invoked
	foo[propName] = foo[propName];
}

/// 
/// Removes a previously linked member and restores it to its previous state.
/// 
export function RemoveMemberShadow(foo, propName)
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
	
	//remove the last stacked callback
	foo[`_SHADOWCALLBACKS_${propName}`].pop();
	if(foo[`_SHADOWCALLBACKS_${propName}`].length < 1)
		delete foo[`_SHADOWCALLBACKS_${propName}`];
}

