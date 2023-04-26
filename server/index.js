const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3001;

//////////
// functions
//////////

async function listFiles(path) {
//  let result = [];
//  const dir = await fs.promises.opendir(path);
//  for await (const dirent of dir) {
//    result.push(dirent);
//  }
  let result = fs.readdirSync(path)
  return result;
}

//////////
// app.get
//////////

app.use(express.static(path.resolve(__dirname, '../babylon/dist')))

app.get("/api/puzzles/list", (req, res) => {
  listFiles("./xmpuzzles").then(
    (r) =>  { 
      res.set('Access-Control-Allow-Origin', '*');
      res.send(Object.values(r)
      .filter(fn => { return /\.xmpuzzle$/.test(fn)})
      .map(fn => { return fn.replace(/\.xmpuzzle$/i, "")})) }
    );
});

app.get('*', (req, res) => {res.sendFile(path.resolve(__dirname, '../babylon/dist', 'index.html'))})

//////////
// app.listen
//////////

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
