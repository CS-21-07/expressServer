const removeRRD = require("../index")

test("RRD files removed", () => {
    removeRRD("/test_raw.qkview")
    let RRD_COUNT = dir.length("./test_RRD")
    expect(RRD_COUNT.tobe(22))
})

test("JSON files converted", () => {
    removeRRD("/test_raw.qkview")
    let JSON_COUNT = dir.length("./test_JSON")
    let RRD_COUNT = dir.length("./test_RRD")
    expect(JSON_COUNT.tobe(RRD_COUNT))
})