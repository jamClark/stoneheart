
function ColorLog(message, color = "normal") {

    color = color || "black";

    switch (color) {
        case "success":  
             color = "Green"; 
             break;
        case "info":     
		     color = "DodgerBlue";  
             break;
        case "error":   
             color = "Red";     
             break;
        case "warning":  
             color = "Orange";   
             break;
		case "normal":
			color = "Black";
			break;
        default: 
             color = color;
    }

    console.log("%c" + message, "color:" + color);
}

function describe(desc, callback)
{
	ColorLog(desc);
	callback();
}

const it = (desc, callback) => describe('    ' + desc, callback);

const expect = (expression) => DefaultMatcher(expression);

const DefaultMatcher = (expression) => ({
	
	toBe: (assertion) =>
	{
		if(expression == assertion)
		{
			ColorLog('    pass', "success");
			return true;
		}
		else
		{
			ColorLog("    fail - expected '" + assertion + "' but was '" + expression + "'", "error");
			return false;
		}
	},
	
	toNotBe: (assertion) =>
	{
		if(expression != assertion)
		{
			ColorLog('    pass', "success");
			return true;
		}
		else
		{
			ColorLog("    fail - expected '" + assertion + "' but was '" + expression + "'", "error");
			return false;
			
		}
	}
})


export { ColorLog, describe, it, expect };


