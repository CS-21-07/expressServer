const fs = require("fs-extra");
const rrdStream = require("./RRDStream");
const util = require("util");
const tar = require("tar");
const path = require("path");
const { pipeline } = require("stream");
const pipelineAsync = util.promisify(pipeline);
const readdir = util.promisify(fs.readdir);

//input and output files
var qkviewDIR = __dirname + "/files/rawQKView";
var base_finalDest = __dirname + "/files/JSON_final";
var finalDest;
var base_rrdDest = __dirname + "/files/rawRRD";
var rrdDest;
var directories = []
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
  else if (directories.length){
    rrd_Path_Array = []
    json_Path_Array = []
    filesConverted = 0
    var dirs = directories.pop()
    await processRRD(dirs[0], dirs[1])
  }
  else{
    console.log("All done!")
  }
};

//pipe from rrd to json using rrdStream transformation
const streamToFile = async (rrdPath, jsonPath, callback) => {
  try {
    await pipelineAsync(
      fs.createReadStream(rrdPath),
      rrdStream(),
      fs.createWriteStream(jsonPath).on("close", callback)
    ); //.catch(error => (error.code !== "ERR_STREAM_PREMATURE_CLOSE" && Promise.reject(error)));
  } catch (e) {
    console.log(e);
  }
};

const get_dir_name = (incoming, root_dir) =>{
  var folder = incoming.substring(incoming.lastIndexOf("/") + 1, incoming.lastIndexOf("."))
  var sub_dir = path.join(root_dir, folder)
  return sub_dir
}


const create_sub_dir = (incoming, root_dir) =>{
  var sub_dir = get_dir_name(incoming, root_dir)
  if (!fs.existsSync(sub_dir)){
    fs.mkdirSync(sub_dir);
  }
  return sub_dir
}

//add all rrd files from qkviewDIR into rrdDest
export const removeRRD = async (qkv = qkviewDIR) => {
  
  let files = await readdir(qkv);
  const promises = [];

  files.forEach((qkviewFile) => {
    if (qkviewFile.includes(".qkview") && !fs.existsSync(get_dir_name(qkviewFile, base_rrdDest))) {

      rrdDest = create_sub_dir(qkviewFile, base_rrdDest);
      finalDest = create_sub_dir(qkviewFile, base_finalDest);
      directories.push([rrdDest, finalDest]);
      
      promises.push(extractTarball(qkv + "/" + qkviewFile));
    } else if (qkviewFile.includes(".rrd")) {
      fs.rename(qkviewFile, path.join(rrdDest, qkviewFile));
    }
  });
  await Promise.all(promises)

  var dirs = directories.pop()
  await processRRD(dirs[0], dirs[1])
};

//start processing all rrd files
export const processRRD = async (rrd, json) => {
  rrdDest = rrd
  finalDest = json
  console.log(rrdDest);
  let files = await readdir(rrdDest);
  fileCount = files.length;
  files.forEach((rrdFile) => {
    finalName = changeExtension(rrdFile, ".json");
    rrdFile = path.join(rrdDest, rrdFile);

    rrd_Path_Array.push(rrdFile);
    json_Path_Array.push(finalName);
  });
  //start streaming from rrd to json

    streamToFile(
    rrd_Path_Array[filesConverted],
    json_Path_Array[filesConverted],
    reactToStreamEvents
    );
};

removeRRD();