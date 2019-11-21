#!/usr/bin/env node
const { proxy, server, init } = require('./index.js');
const [ cpath, apath, spath ] = ['./config.json', './ca.crt', './server.json'];
switch(process.argv[2]){
case 'proxy': proxy(cpath); break;
case 'server': server(spath); break;
case 'init': init(cpath, apath, spath).then(console.log); break;
default: 
console.log(
`Usage: magent <option>

Options:
  init 		Setup the config
  server 	Start the server
  proxy 	Start the proxy

Notice:
  Only the HTTP(s) message can pass throuth this proxy
  Import the root certifcate 'ca.crt' to your system or browser to let it work

Magent v1.0.3
Copyright (c) 2019 DNetL <DNetL@pm.me>;
Report Magent translation bugs to <https://github.com/DNetL/magent/issues>`);
}