const express = require("express");
const fs = require("fs");
const path = require("path");
const ZIP = require('zlib');
const XML = require('fast-xml-parser');
const PWBP = require('./PWBP/convert.js')

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
					if (td.img) {
						idx=td.img.attributes.src.replace(/(-.)?\.gif/,"")
						if (img.indexOf(idx)== -1 ) {img.push(idx);count[idx]=1} else count[idx]++ 
					}
					if (td.table) subTables.push(...td.table)
				})))
				subTables.forEach(t => t.tr.forEach(tr => tr.td.forEach(td =>  { 
					if (td.img) {
						idx=td.img.attributes.src.replace(/(-.)?\.gif/,"")
						if (img.indexOf(idx)== -1 ) {img.push(idx);count[idx]=1} else count[idx]++ 
					}
				})))
				return img.map(el => { 
					let p=el.replaceAll("../","").split('/')
					return {path : p, count: count[el], converted: PWBP.convert(p)} 
				})
			}
		)
	return result
}

//////////
// app.get
//////////
app.use(express.json())
app.use(express.static(path.resolve(__dirname, '../babylon/dist')))

app.get(
	"/api/test", 
	(req, res) => {
		console.log(req.query)
		console.log(req.body)
		res.send("get done")
	}
);
app.post(
	"/api/test", 
	(req, res) => {
		console.log(req.query)
		console.log(req.body)
		res.send("post done")
	}
);

// 2 tables:
// Table 1 = uri -> uid mapping
//    if a uri (from PWBP) is present in this table, it means it has been uploaded as xmpuzzle file to this server.
// Table 2 = uid -> metadata
//    metadata contains info such as designer, name, #pieces, moves, date, ...
// the uid should be the basename for files related to the puzzle
// in order for the tables to be reconstructable from the puzzle files:
//    the uid can be recovered from the file names
//	  topology related data can also be recovered from the puzzle (pieces, moves)
//    all other fields need to be stored in the comments field of the xmpuzzle file! (designer, name, date, ..?)

// suggested api for individual puzzles (uri on PWBP can be used as unique ID)
// a PWBP puzzle that has an uploaded xml file will have both an id a uri and can be accessed using both api's
// /api/puzzle?uid=xxx (get/put) id must exist to update file
// /api/puzzle?uri=xxx (get) use Table 1 to map uri to uid. If not present, (get) creates xmpuzzle file, caches, and returns it including uid. (put) should alwas refer to the uid?
// /api/puzzle (put) upload new puzzle and return id (no query specified)
// /api/puzzle/thumb?uid=xxx (get/put)
// /api/puzzle/thumb?uri=xxx (get)
// /api/index (get) = only puzzles that have an id = puzzles with an xmpuzzle file uploaded
// /api/index/PWBP (get) = overview of puzzles on PWBP

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
	"/api/PWBP/puzzle/:shape/:name/:optional?", 
	(req, res) => {
			let p = req.params.name
			if (req.params.optional) p=p+"/"+req.params.optional
			loadPWBPpuzzle(req.params.shape, p).then
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
