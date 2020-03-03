

/// 
/// Helper method for syncronously loading text files. This will 
/// generate warning due to its snychronous nature.
/// 
export function LoadFileSync(filePath) 
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filePath, false);
	xmlhttp.send();
	if (xmlhttp.status!=200) 
		throw new Error(xmlhttp.responseText);
	return xmlhttp.responseText;
}

