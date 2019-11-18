#!/usr/bin/env node
const { proxy, server, init } = require('./index.js');
switch(process.argv[2]){
case 'proxy': proxy(); break;
case 'server': server(); break;
case 'init': init(); break;
default: 
console.log(
`Magent v1.0.2

Setup: magent init
Server: magent server
Client: magent proxy
Notice:
  Only the HTTP(s) message can pass throuth this proxy
  Import the root certifcate 'ca.crt' to your system or browser to let it work

Copyright (c) 2019 DNetL <DNetL@pm.me>;
Report Magent translation bugs to <https://github.com/DNetL/magent/issues>`);
}