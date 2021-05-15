import * as path from "path";
import * as express from "express";
import * as logger from "morgan";
import * as url from "url";
import * as bodyParser from "body-parser";
import * as fileUpload from "express-fileupload";
import * as cors from "cors";
import * as multer from "multer";
import * as fs from "fs";
// Creates and configures an ExpressJS web server.
class App {
  // ref to Express instance
  public express: express.Application;
  public upload;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.upload = multer({
      dest: "uploaded/",
    });
    this.middleware();
    this.routes();
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

    router.post("/upload", this.upload.single("file"), (req, res) => {
      const tempPath = req["file"].path;
      const targetPath = path.join(__dirname, "./files/raw.qkview");
      /** A better way to copy the uploaded file. **/
      var src = fs.createReadStream(tempPath);
      var dest = fs.createWriteStream(targetPath);
      src.pipe(dest);
      // src.on("end", function () {
      //   res.render("complete");
      // });
      // src.on("error", function (err) {
      //   res.render("error");
      // });
      res.send("file has been uploaded");
    });

    this.express.use("/", router);

    this.express.use("/images", express.static(__dirname + "/img"));
    this.express.use("/", express.static(__dirname + "/public"));
    this.express.use(cors);
    this.express.use(fileUpload);
  }
}

export { App };
