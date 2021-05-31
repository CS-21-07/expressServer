This directory contains one express servers:
* AppServer.ts - express web server with parameter support
* App.ts - express server class that is constructed via AppServer.ts

Make sure you install the node.js server software.  Ensure your path variable contains the execution path of the node.js binary.

To execute the server run the following commands:

1. install prerequisites: npm install (inside both expressServer directory and rrdJS directory since there are 2 different package.json)

2. compile AppServer.ts: tsc AppServer.ts

3. execute AppServer: node AppServer.js (npm start)

To test static server routes, try the following URL on the browser while the server is running:
* http://localhost:8080/
* http://localhost:8080/index.html
* http://localhost:8080/images/image1.png

To test dynaic server routes, try the following URL on the browser while the server is running:
* http://localhost:8080/one
* http://localhost:8080/add?var1=1&var2=2
* http://localhost:8080/name/israelh
* http://localhost:8080/name/hello