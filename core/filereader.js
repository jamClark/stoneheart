

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

export function CreateFileDownload(content, type = "text/plain;charset=utf-8")
{
	/*
	let link = document.createElement('a');
	link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	link.setAttribute('download', filename);
	link.style.display = 'none';
	link.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	*/
	
	let link = document.createElement('a');
	link.style.display = "none";
	var file = new Blob([content], {type: type});
	link.href = URL.createObjectURL(file);
	link.download = name;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
