const fs = require('fs-extra');
const rrdStream = require('./RRDStream');
const util = require('util');
const tar = require('tar');
const path = require('path');
const { pipeline } = require('stream');
const pipelineAsync = util.promisify(pipeline);
const readdir = util.promisify(fs.readdir);

//input and output files
var qkviewDIR = "../files/rawQKView";
var finalDest = "../files/JSON_final";
var rrdDest = "../files/rawRRD";

//extract all rrd files from the tarball
const extractTarball = async (qkviewFile, cb) => {
  tar.extract({
    file: qkviewFile,
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
};//end of untaring


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
  console.log(filesConverted, fileCount)
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
  try{
    file = jsonPath.substring(jsonPath.lastIndexOf("/") + 1) + ":";
      await pipelineAsync(
        fs.createReadStream(rrdPath),
        rrdStream(),
        fs.createWriteStream(jsonPath).on('close', callback)
    )//.catch(error => (error.code !== "ERR_STREAM_PREMATURE_CLOSE" && Promise.reject(error)));
  } catch(e){
    console.log(e)
  }
};

//add all rrd files from qkviewDIR into rrdDest
export const removeRRD = async () => {
  console.log("start")
  let files = await readdir(qkviewDIR);
  const promises = []
  files.forEach((qkviewFile) => {
    if (qkviewFile.includes(".qkview")) {
      console.log("inner")
      promises.push(extractTarball(qkviewDIR + "/" + qkviewFile));
    } else if (qkviewFile.includes(".rrd")) {
      //this WILL remove the rrd file from its current location
      fs.rename(qkviewFile, path.join(rrdDest, qkviewFile));
    }
  })
  await Promise.all(promises)
  await processRRD();
  console.log("outer")
}

//start processing all rrd files
const processRRD = async () => {
  let files = await readdir(rrdDest);
  fileCount = files.length;
  files.forEach((rrdFile) =>{
    finalName = changeExtension(rrdFile, ".json");
    rrdFile = path.join(rrdDest, rrdFile);

    rrd_Path_Array.push(rrdFile);
    json_Path_Array.push(finalName);
  })
  //start streaming from rrd to json
  await streamToFile(
    rrd_Path_Array[filesConverted],
    json_Path_Array[filesConverted],
    reactToStreamEvents
  );
};