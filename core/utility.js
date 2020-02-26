

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

