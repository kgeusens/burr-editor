const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3001;

//////////
// functions
//////////

async function listFiles(path) {
  let result = [];
  const dir = await fs.promises.opendir(path);
  for await (const dirent of dir) {
    result.push(dirent);
  }
  return result;
}

//////////
// app.get
//////////

app.use(express.static(path.resolve(__dirname, '../babylon/dist')))

app.get("/api", (req, res) => {
  listFiles("./").then((r) => res.send(Object.values(r)));
});

app.get('*', (req, res) => {res.sendFile(path.resolve(__dirname, '../babylon/dist', 'index.html'))})

//////////
// app.listen
//////////

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
