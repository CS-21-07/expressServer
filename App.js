"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var childProcess = require("child_process");
// Creates and configures an ExpressJS web server.
//npm install @types/node@latest
var App = /** @class */ (function () {
    //Run configuration methods on the Express instance.
    function App() {
        this.express = express();
        this.upload = multer({
            dest: "dest"
        });
        this.middleware();
        this.routes();
        this.baseDir = "rrdJS/files/JSON_final/";
        this.uploadIdTracker = 0;
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
        var _this = this;
        var router = express.Router();
        router.post("/api/upload/:uploadId", this.upload.single("file"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var tempPath, targetPath, src, dest, done;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.uploadIdTracker = req.params.uploadId;
                        tempPath = req["file"].path;
                        targetPath = path.join(__dirname, "rrdJS/files/rawQKView/" +
                            "upload_" +
                            this.uploadIdTracker +
                            "_raw.qkview");
                        src = fs.createReadStream(tempPath);
                        dest = fs.createWriteStream(targetPath);
                        src.pipe(dest);
                        return [4 /*yield*/, src.on("end", function () {
                                res.send("file has been uploaded");
                            })];
                    case 1:
                        done = _a.sent();
                        src.on("error", function (err) {
                            res.send("Error in uploading files");
                        });
                        if (done) {
                            this.runScript("./rrdJS/index.js", function (err) {
                                if (err)
                                    throw err;
                                console.log("finished running the converter");
                            });
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        router.get("/api/jsonfile/:filename", function (req, res) {
            var fname = req.params.filename;
            console.log(fname);
            fs.readFile(_this.baseDir + fname, "utf-8", function (err, data) {
                if (err) {
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else {
                    res.send(data);
                }
            });
        });
        router["delete"]("/api/deleteAll", function (req, res) {
            _this.deleteContentOfFolder("rrdJS/files/JSON_final");
            _this.deleteContentOfFolder("rrdJS/files/rawQKView");
            _this.deleteContentOfFolder("rrdJS/files/rawRRD");
            res.send("done!");
        });
        this.express.use("/", router);
        this.express.use("/images", express.static(__dirname + "/img"));
        this.express.use("/", express.static(__dirname + "/public"));
        this.express.use(cors);
        this.express.use(fileUpload);
    };
    App.prototype.runScript = function (scriptPath, callback) {
        // keep track of whether callback has been invoked to prevent multiple invocations
        console.log("STARTED");
        var invoked = false;
        var process = childProcess.fork(scriptPath);
        // listen for errors as they may prevent the exit event from firing
        process.on("error", function (err) {
            if (invoked)
                return;
            invoked = true;
            callback(err);
        });
        // execute the callback once the process has finished running
        process.on("exit", function (code) {
            if (invoked)
                return;
            invoked = true;
            var err = code === 0 ? null : new Error("exit code " + code);
            callback(err);
        });
    };
    App.prototype.deleteContentOfFolder = function (directory) {
        fs.readdir(directory, function (err, files) {
            if (err)
                throw err;
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                fs.unlink(path.join(directory, file), function (err) {
                    if (err)
                        throw err;
                });
            }
        });
    };
    return App;
}());
exports.App = App;
