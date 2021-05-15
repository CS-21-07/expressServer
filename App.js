"use strict";
exports.__esModule = true;
exports.App = void 0;
var path = require("path");
var express = require("express");
var logger = require("morgan");
var bodyParser = require("body-parser");
var fileUpload = require("express-fileupload");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");
// Creates and configures an ExpressJS web server.
var App = /** @class */ (function () {
    //Run configuration methods on the Express instance.
    function App() {
        this.express = express();
        this.upload = multer({
            dest: "uploaded/"
        });
        this.middleware();
        this.routes();
    }
    // Configure Express middleware.
    App.prototype.middleware = function () {
        this.express.use(logger("dev"));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
                error: err
            });
        });
    };
    // Configure API endpoints.
    App.prototype.routes = function () {
        var router = express.Router();
        router.post("/upload", this.upload.single("file"), function (req, res) {
            var tempPath = req["file"].path;
            var targetPath = path.join(__dirname, "./files/raw.qkview");
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
        this.express.use("/", express.static(__dirname + "/pages"));
        this.express.use(cors);
        this.express.use(fileUpload);
    };
    return App;
}());
exports.App = App;
