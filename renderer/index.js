const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require('path');

function render(diffString) {
  let Mustache = require("mustache");
  let template = fs.readFileSync("./index.mustache", "utf8");
  let html = Mustache.render(template, { diffString });
  console.log(html);
}

function diffString(baseDir, src, dst) {
  let cmd = "diff -ruN " + src + " " + dst;
  // console.debug(cmd);

  try {
    execFileSync("diff", ["-ruN", src, dst]);
    return "";
  } catch ({ stdout }) {
    return stdout.toString();
  }
}


let baseDir = path.join(process.argv[2], '_artifacts');
let oldBranch = path.join(baseDir, process.argv[3]);
let newBranch = path.join(baseDir, process.argv[4]);

render(diffString(baseDir, oldBranch, newBranch));
