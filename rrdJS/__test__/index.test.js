import {removeRRD} from "../index";
const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);

test("RRD files removed", async () => {
    const dir = await removeRRD;
    console.log(dir)
    let RRD_COUNT = (await readdir(dir)).length
    expect(RRD_COUNT).toBe(22);
});

// test("JSON files converted", async () => {
//     await removeRRD(__dirname + "/test_QKView")
//     let RRD_COUNT = 0;
//     let JSON_COUNT = 0;
//     fs.readdir(__dirname + "/test_RRD", (err, files) => {
//         console.log(files.length)
//         RRD_COUNT = files.length
//     })
//     fs.readdir(__dirname + "/test_JSON", (err, files) => {
//         console.log(files.length)
//         JSON_COUNT = files.length
//     })
//     expect(JSON_COUNT).toBe(RRD_COUNT);
// })