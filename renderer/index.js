const { execFileSync } = require("child_process");
const { readFileSync } = require("fs");

function render(diffString) {
  let Mustache = require("mustache");
  let template = readFileSync("./index.mustache", "utf8");
  let html = Mustache.render(template, { diffString });
  console.log(html);
}

function diffString(baseDir) {
  let OLD_BRANCH = baseDir + "/" + process.argv[2];
  let NEW_BRANCH = baseDir + "/" + process.argv[3];

  let cmd = "diff -ruN " + OLD_BRANCH + " " + NEW_BRANCH;
  // console.debug(cmd);

  try {
    execFileSync("diff", ["-ruN", OLD_BRANCH, NEW_BRANCH]);
    return "";
  } catch ({ stdout }) {
    return stdout.toString();
  }
}

render(diffString("../_artifacts"));
