import * as path from "path";
import * as express from "express";
import * as logger from "morgan";
// import * as url from "url";
import * as bodyParser from "body-parser";
import * as fileUpload from "express-fileupload";
import * as cors from "cors";
import * as multer from "multer";
import * as fs from "fs";
// import removeRRD from "./rrdjs/index.js";
import * as childProcess from "child_process";
// Creates and configures an ExpressJS web server.
//npm install @types/node@latest
class App {
  // ref to Express instance
  public express: express.Application;
  public upload;
  public baseDir: string;
  public uploadIdTracker: number;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.upload = multer({
      dest: "dest",
    });
    this.middleware();
    this.routes();
    this.baseDir = "rrdJS/files/JSON_final/upload_0_raw/";
    this.uploadIdTracker = 0;
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(logger("dev"));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));

    this.express.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
      next();
    });

    // error handler
    this.express.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};

      // render the error page
      res
        .status(err.status || 500)
        .contentType("text/plain")
        .end("Oops! Something went wrong!");
      res.json({
        message: err.message,
        error: err,
      });
    });
  }

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();

    router.post(
      "/api/upload/:uploadId",
      this.upload.single("file"),
      async (req, res) => {
        const nms = req["file"].filename
        this.uploadIdTracker = req.params.uploadId;
        const tempPath = req["file"].path;
        const targetPath = path.join(
          __dirname,
          "rrdJS/files/rawQKView/" +
            "upload_" +
            this.uploadIdTracker +
            "_raw.qkview"
        );
        /** A better way to copy the uploaded file. **/
        console.log(nms)
        var src = fs.createReadStream(tempPath);
        var dest = fs.createWriteStream(targetPath);
        src.pipe(dest);
        var done = await src.on("end", function () {
          res.send("file has been uploaded");
        });
        src.on("error", function (err) {
          res.send("Error in uploading files");
        });
        if (done) {
          this.runScript("./rrdJS/index.js", function (err) {
            if (err) throw err;
            console.log("finished running the converter");
          });
        }
      }
    );

    router.get("/api/jsonfile/:filename", (req, res) => {
      let fname = req.params.filename;
      console.log(fname);
      fs.readFile(this.baseDir + fname, "utf-8", (err, data) => {
        if (err) {
          res.json({
            message: err.message,
            error: err,
          });
        } else {
          res.send(data);
        }
      });
    });

    router.delete("/api/deleteAll", (req, res) => {
      this.deleteContentOfFolder("rrdJS/files/JSON_final");
      this.deleteContentOfFolder("rrdJS/files/rawQKView");
      this.deleteContentOfFolder("rrdJS/files/rawRRD");
      this.deleteContentOfFolder("dest");

      res.send("done!");
    });

    this.express.use("/", router);

    this.express.use("/images", express.static(__dirname + "/img"));
    this.express.use("/", express.static(__dirname + "/public"));
    this.express.use(cors);
    this.express.use(fileUpload);
  }

  runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    console.log("STARTED");
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on("error", function (err) {
      if (invoked) return;
      invoked = true;
      callback(err);
    });

    // execute the callback once the process has finished running
    process.on("exit", function (code) {
      if (invoked) return;
      invoked = true;
      var err = code === 0 ? null : new Error("exit code " + code);
      callback(err);
    });
  }

  deleteContentOfFolder(directory: string) {
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });
  }
}

export { App };
