const express = require("express");
const fs = require("fs");
const path = require("path");
const ZIP = require('zlib');
const XML = require('fast-xml-parser');

const app = express();
const port = 3001;
const puzzleDir = "./xmpuzzles"

//////////
// functions
//////////

async function listFiles(path) {
  let result = fs.readdirSync(path)
  return result;
}

function loadPuzzle(xmpuzzle) {
	const XMLAlwaysArrayName = [
		"voxel",
		"shape",
		"problem",
		"solution",
		"separation",
		"state"
	];
	const XMLoptions = { 
		textNodeName: "text", 
		format: true, 
		ignoreAttributes: false, 
		indentBy: " ", 
		suppressEmptyNode: true, 
		alwaysCreateTextNode: true, 
		attributesGroupName: "@attributes", 
		attributeNamePrefix: '',
		isArray: (name, jpath, isLeafNode, isAttribute) => { 
			if( XMLAlwaysArrayName.indexOf(name) !== -1) return true;
		}
	}
    const xmpuzzleFile = fs.readFileSync(xmpuzzle);
	const parser = new XML.XMLParser(XMLoptions);
	const xmlContent = ZIP.gunzipSync(xmpuzzleFile)
	var result = parser.parse(xmlContent)
	return result
}

async function loadPWBPindex() {
	const XMLoptions = { 
		textNodeName: "text", 
		format: true, 
		ignoreAttributes: false, 
		indentBy: " ", 
		suppressEmptyNode: false, 
		alwaysCreateTextNode: true, 
		attributesGroupName: "attributes", 
		attributeNamePrefix: '',
	}
	const parser = new XML.XMLParser(XMLoptions)
	let result=fetch('https://puzzlewillbeplayed.com/-/puzzle-index.xml', { mode: "cors" })
		.catch(error => console.log(error))
		.then(res => res.text())
		.then(xml => parser.parse(xml)["puzzle-index"].puzzle)
	return result
}

async function loadPWBPpuzzle(shape, name) {
	const XMLAlwaysArrayName = [
		"table",
		"tr",
		"td",
	];
	const XMLoptions = { 
		textNodeName: "text", 
		format: true, 
		ignoreAttributes: false, 
		indentBy: " ", 
		suppressEmptyNode: false, 
		attributesGroupName: "attributes", 
		alwaysCreateTextNode: true, 
		attributeNamePrefix: '',
		isArray: (name, jpath, isLeafNode, isAttribute) => { 
			if( XMLAlwaysArrayName.indexOf(name) !== -1) return true;
		}
	}
	const parser = new XML.XMLParser(XMLoptions)
	let result=fetch('https://puzzlewillbeplayed.com/'+shape+"/"+name, { mode: "no-cors" })
		.catch(error => console.log(error))
		.then(res => res.text())
		.then(
			xml => { 
				let arr=parser.parse(xml).html.body.table
					.find(el => el.attributes ? el.attributes.summary == "pieces" : false )
					.tr[0].td[0].table
				let img=[]
				let count={}
				let subTables=[]
				arr.forEach(t => t.tr.forEach(tr => tr.td.forEach(td =>  { 
					if (td.img) if (img.indexOf(td.img.attributes.src)== -1 ) {img.push(td.img.attributes.src );count[td.img.attributes.src]=1} else count[td.img.attributes.src]++ 
					if (td.table) subTables.push(...td.table)
				})))
				subTables.forEach(t => t.tr.forEach(tr => tr.td.forEach(td =>  { 
					if (td.img) if (img.indexOf(td.img.attributes.src)== -1 ) {img.push(td.img.attributes.src );count[td.img.attributes.src]=1} else count[td.img.attributes.src]++ 
				})))
				return img.map(el => { return {path : el.split('/').slice(2), count: count[el]} })
			}
		)
			
		
//		arr.forEach(t => t.tr.forEach(tr => tr.td.forEach(td => res.push(td.img.attributes.src))))		
	return result
}

//////////
// app.get
//////////

app.use(express.static(path.resolve(__dirname, '../babylon/dist')))

app.get("/api/puzzles/list", (req, res) => {
  listFiles(puzzleDir).then(
    (r) =>  { 
      res.set('Access-Control-Allow-Origin', '*');
      res.send(Object.values(r)
      .filter(fn => { return /\.xmpuzzle$/.test(fn)})
      .map(fn => { return fn.replace(/\.xmpuzzle$/i, "")})) }
    );
});

app.get("/api/puzzles/get/:file", (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  let obj = {}
  obj.filename = req.params.file + '.xmpuzzle';
  obj.content = loadPuzzle(puzzleDir + "/" + obj.filename);
  res.send(obj);
});

app.get(
	"/api/PWBP/index", 
	(req, res) => {
			loadPWBPindex().then
			(
				(r) =>  { 
				  res.set('Access-Control-Allow-Origin', '*');
				  res.send(r)
				}
				);
			}
);

app.get(
	"/api/PWBP/puzzle/:shape/:name", 
	(req, res) => {
			loadPWBPpuzzle(req.params.shape, req.params.name).then
			(
				(r) =>  { 
					console.log(JSON.stringify(r))
				  	res.set('Access-Control-Allow-Origin', '*');
				  	res.send(r)
				}
				);
			}
);
		
app.get('*', (req, res) => {res.sendFile(path.resolve(__dirname, '../babylon/dist', 'index.html'))})

//////////
// app.listen
//////////

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
