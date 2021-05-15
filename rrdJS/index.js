const fs = require("fs-extra");
const rrdStream = require("./RRDStream");
const tar = require("tar");
const path = require("path");
const { Console } = require("console");
const { pipeline } = require("stream");

//input and output files
var qkviewDIR = fs.readdir("../files");
var finalDest = "../src/data/rawJson";
var rrdDest = "../src/data/rawRdd";
if (!fs.existsSync(rrdDest)) {
  fs.mkdirSync(rrdDest);
}

//extract all rrd files from the tarball
const extractTarball = async (cb) => {
  tar.extract({
    file: qkviewDIR,
    cwd: rrdDest,
    sync: true,
    strip: 2,
    filter: function (name) {
      if (name.includes(".rrd")) {
        return true;
      }
      return false;
    },
  });
}; //end of untaring

//start of converting
var rrd_Path_Array = [];
var json_Path_Array = [];
var filesConverted = 0;
var fileCount = 0;

//returns a file of the same name with a different extension
//.rrd -> .json
function changeExtension(file, extension) {
  var temp = file;
  basename = temp.substring(0, temp.indexOf("."));
  return path.join(finalDest, basename + extension);
}

//callback function for streamToFile
const reactToStreamEvents = async (value) => {
  //continue to next file
  if (filesConverted < fileCount - 1) {
    filesConverted++;
    await streamToFile(
      rrd_Path_Array[filesConverted],
      json_Path_Array[filesConverted],
      reactToStreamEvents
    );
  }
  //all files processed
  //TODO: empty qkview and rrd directories
  else {
    console.log("All done!");
  }
};

//pipe from rrd to json using rrdStream transformation
const streamToFile = async (rrdPath, jsonPath, callback) => {
  file = jsonPath.substring(jsonPath.lastIndexOf("/") + 1) + ":";
  await pipeline(
    fs.createReadStream(rrdPath),
    rrdStream(),
    fs.createWriteStream(jsonPath),
    (err) => {
      if (err) {
        console.error(file, "conversion failed", err);
      } else {
        console.log(file, "conversion succeeded");
        callback();
      }
    }
  );
};

//add all rrd files from qkviewDIR into rrdDest
for (var file in qkviewDIR) {
  if (file.includes(".qkview")) {
    extractTarball();
  } else if (file.includes(".rrd")) {
    //this WILL remove the rrd file from its current location
    fs.rename(file, path.join(rrdDest, file));
  }
}

//start processing all rrd files
fs.readdir(rrdDest, async function (err, files) {
  fileCount = files.length;
  for (let rrdFile of files) {
    finalName = changeExtension(rrdFile, ".json");
    rrdFile = path.join(rrdDest, rrdFile);

    rrd_Path_Array.push(rrdFile);
    json_Path_Array.push(finalName);
  }
  //start streaming from rrd to json
  streamToFile(
    rrd_Path_Array[filesConverted],
    json_Path_Array[filesConverted],
    reactToStreamEvents
  );
});
