import express from "express"
import {readdirSync, readFileSync, writeFileSync} from 'fs'
import {resolve} from 'node:path'
import {gzipSync, gunzipSync} from 'zlib'
import { XMLParser } from "fast-xml-parser"
import { convert } from "./PWBP/convert.js"
import cors from "cors"
import path from 'path'
import { fileURLToPath } from 'url';
import {Low} from "lowdb"
import {JSONFile} from "lowdb/node"
import { init } from '@paralleldrive/cuid2';
import { Puzzle } from '@kgeusens/burr-data'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;
const puzzleDir = "./cache/puzzles/"

//////////
// setup
//////////
const lowAdapter=new JSONFile(resolve(__dirname, './cache', 'puzzles.json'))
const DB=new Low(lowAdapter, {version: "1", puzzles:{}, uriToId: {}})
await DB.read()
await DB.write()

const createId = init({
	random: Math.random,
	length: 12,
	fingerprint: 'zweinstein-forever',
  });
  
//////////
// functions
//////////

async function listFiles(path) {
  let result = readdirSync(path)
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
    const xmpuzzleFile = readFileSync(xmpuzzle);
	const parser = new XMLParser(XMLoptions);
	const xmlContent = gunzipSync(xmpuzzleFile)
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
	const parser = new XMLParser(XMLoptions)
	let result=fetch('https://puzzlewillbeplayed.com/-/puzzle-index.xml', { mode: "cors" })
		.catch(error => console.log(error))
		.then(res => res.text())
		.then(xml => parser.parse(xml)["puzzle-index"].puzzle.filter(el => el.attributes.cat === "I").map(el => 
        { return { 
            name: el.attributes.ename, 
            designer : el.attributes.dsgn,
            date: el.attributes.date,
            shape: el.attributes.shape,
            moves: el.attributes.moves?el.attributes.moves.match(/\d*/)[0]:0,
            uri: el.attributes.uri,
            goal: el.attributes.goal,
            category: el.attributes.cat,
            subcategory: el.attributes.subcat,
          } })
		)
	return result
}

async function loadPWBPpuzzle(uri) {
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
	const parser = new XMLParser(XMLoptions)
	let result=fetch('https://puzzlewillbeplayed.com/'+uri, { mode: "no-cors" })
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
						let idx=td.img.attributes.src.replace(/(-.)?\.gif/,"")
						if (img.indexOf(idx)== -1 ) {img.push(idx);count[idx]=1} else count[idx]++ 
					}
					if (td.table) subTables.push(...td.table)
				})))
				subTables.forEach(t => t.tr.forEach(tr => tr.td.forEach(td =>  { 
					if (td.img) {
						let idx=td.img.attributes.src.replace(/(-.)?\.gif/,"")
						if (img.indexOf(idx)== -1 ) {img.push(idx);count[idx]=1} else count[idx]++ 
					}
				})))
				return img.map(el => { 
					let p=el.replaceAll("../","").split('/')
					return {path : p, count: count[el], converted: convert(p)} 
				})
			}
		)
	return result
}

//////////
// app.get
//////////
app.use(express.json())
app.use(cors())
app.use(express.static(resolve(__dirname, '../babylon/dist')))


// 2 tables:
// Table 1 = uri -> uid mapping
//    if a uri (from PWBP) is present in this table, it means it has been uploaded as xmpuzzle file to this server.
// Table 2 = uid -> metadata
//    metadata contains info such as designer, name, #pieces, moves, date, ...
// the uid should be the basename for files related to the puzzle
// in order for the tables to be reconstructable from the puzzle files:
//    the uid can be recovered from the file names
//	  topology related data can also be recovered from the puzzle (pieces, moves)
//    all other fields need to be stored in the comments field of the xmpuzzle file! (designer, name, date, uri, ..?)

// suggested api for individual puzzles (uri on PWBP can be used as unique ID)
// a PWBP puzzle that has an uploaded xml file will have both an id a uri and can be accessed using both api's
// /api/puzzle?uid=xxx (get/put) id must exist to update file
// /api/puzzle?uri=xxx (get) use Table 1 to map uri to uid. If not present, (get) creates xmpuzzle file, caches, and returns it including uid. (put) should alwas refer to the uid?
// /api/puzzle (put) upload new puzzle and return id (no query specified)
// /api/puzzle/thumb?uid=xxx (get/put)
// /api/puzzle/thumb?uri=xxx (get)
// /api/index (get) = only puzzles that have an id, that means puzzles with an xmpuzzle file uploaded
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
	"/api/PWBP/puzzle/:shape/:name/:optional?", 
	(req, res) => {
			let p = req.params.name
			if (req.params.optional) p=p+"/"+req.params.optional
			loadPWBPpuzzle(req.params.shape + "/" + p).then
			(
				(r) =>  { 
				  	res.set('Access-Control-Allow-Origin', '*');
				  	res.send(r)
				}
				);
			}
);

// query for existing id (provided query), or get new id (no query)
app.get(
	"/api/puzzle/id", 
	(req, res) => {
		let reply={}
		reply.id = createId()
		res.send(JSON.stringify(reply))
	}
);

// Get index from PWBP, and patch with id from local cache.
// ID can be used to retrieve cached file.
// Need to take out the PWBP in the path and make it more generic
app.get(
	"/api/PWBP/index", 
	(req, res) => {
			loadPWBPindex().then
			(
				(obj) =>  {
					for (let i in obj) {
						obj[i].id=DB.data.uriToId[obj[i].uri]
					}
					res.send(obj)
				}
			);
		}
);

// Return a puzzle
app.get(
	"/api/puzzle/", 
	(req, res) => {
		let obj = {filename: ""}
		if (req.query.id && DB.data.puzzles[req.query.id]) {
			obj.filename = req.query.id + '.xmpuzzle';
			obj.meta=DB.data.puzzles[req.query.id]
			obj.content = loadPuzzle(puzzleDir + "/" + obj.filename);
			res.send(obj);
		} else if (req.query.uri) { 
			loadPWBPpuzzle(req.query.uri).then
			(
				(r) =>  {
					let p = new Puzzle()
					p.deleteShape(0)
					let i=0
					r.forEach(el => {
						i=p.addShape();
						p.getShape(i).setSize(el.converted.x,el.converted.y,el.converted.z)
						p.getShape(i).stateString=el.converted.stateString
						p.getShape(i).name= "p" + i.toString()
						let ps=p.problems.problem[0].getShapeFromId(i)
						ps.count = el.count
						p.problems.problem[0].setShape(ps)
					})
					let solIDX = p.addShape()
					p.getShape(solIDX).name="Solution"
					p.getShape(solIDX).stateString="#"
					p.problems.problem[0].result.id=solIDX
					p.meta["source"]="PWBP"
					obj.content = p.saveToJSON()
				  	res.send(obj)
				}
			)
		} else {
			res.send(obj);
		}
	}
);


// proxy to gui (babylonjs)
app.get('*', (req, res) => {res.sendFile(resolve(__dirname, '../babylon/dist', 'index.html'))})

//////////
// app.post
//////////

app.post(
	"/api/puzzle", 
	// body contains:
	//   metadata (object) and 
	//   puzzle (xml string) and 
	//   optional id (allthough client shoud check for id and make sure it's present)
	(req, res) => {
		let reply=req.body.meta?req.body.meta:{}
		let puzzleXML=req.body.puzzle
		if (reply.id == "" || reply.id === undefined ) reply.id = createId()
		// body is now parsed into reply, puzzleXML, and reply.id is forced
		// compress to xmpuzzle and save to disk as id.xmpuzzle
		let xmpuzzle=gzipSync(puzzleXML)
		writeFileSync(puzzleDir + reply.id + ".xmpuzzle",xmpuzzle)
		// save the metadata to the database
		DB.data.puzzles[reply.id]=reply
		// map the uri (if present) to the id (needed to recover the xmpuzzle file) and add to the DB
		if (reply.uri) DB.data.uriToId[reply.uri]=reply.id
		DB.write()
		res.send(JSON.stringify(reply))
	}
);


//////////
// app.listen
//////////

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
