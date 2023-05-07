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

async function listFiles(path) {
  let result = fs.readdirSync(path)
  return result;
}

function loadPuzzle(xmpuzzle) {
  //load the file
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
		
app.get('*', (req, res) => {res.sendFile(path.resolve(__dirname, '../babylon/dist', 'index.html'))})

//////////
// app.listen
//////////

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
