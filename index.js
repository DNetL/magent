#!/usr/bin/env node
const readline = require('readline');
const http = require('http');
const https = require('https');
const ca = require('./ca.js');
const tls = require('tls');
const net = require('net');
const fs = require('fs');
const logcb = (...args)=>console.log.bind(this,...args);
const errcb = (...args)=>console.error.bind(this,...args);

const reqPipe = (url,opts,res)=>require(url.protocol.slice(0,-1))
	.request(url, opts, nRes=>{res.writeHead(nRes.statusCode, nRes.headers); nRes.pipe(res);})
	.on('error', e=>{res.writeHead(500); res.end(e.message);}).end();
const SNICallback = (host, cb)=>ca.cert(host).then(kp=>cb(null, tls.createSecureContext(kp)));

const proxy = async()=>{
	let {uname,tname,u,t,bind,port,mport,mkey,mcert,scert}=JSON.parse(fs.readFileSync('./config.json'));
	ca.load(mkey,mcert);
	const reqHandle = o=>(req, res)=>{
		const {method, headers, url}=req;
		const ourl=o?url:`https://${headers.host}${url}`;
		const purl=new URL(u), id=Date.now(); headers.host=purl.host;
		reqPipe(purl, {ca:scert, method, headers:{...headers,[uname]:ourl,[tname]:t}, minVersion:'TLSv1.3'}, res)
			.on('socket', socket=>logcb(id,socket.getProtocol())(method,ourl))
			.on('error', errcb(id,method,ourl));
	}
	https.createServer({SNICallback}, reqHandle(false)).listen(mport,bind, ()=>
		http.createServer(reqHandle(true)).on('connect', (req, socket, head)=>{
			net.connect(mport,bind, function(){
				socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
				this.write(head); this.pipe(socket).pipe(this);
			}).on('error', errcb('mitm[error]'));
	}).listen(port,bind, logcb('proxy running...')));
}
const server = async()=>{
	let {uname,tname,t,sport,skey,scert}=JSON.parse(fs.readFileSync('./server.json'));
	ca.load(skey,scert);
	https.createServer({SNICallback, minVersion:'TLSv1.3'}, (req, res)=>{
		const {method, headers}=req;
		if(headers[tname]===t){
			const ourl=new URL(headers[uname]), id=Date.now(); headers.host=ourl.host;
			for(let name of [tname,uname]) delete headers[name];
			reqPipe(ourl, {method,headers}, res)
				.on('socket', socket=>logcb(id)(method,ourl.href))
				.on('error', errcb(id,method,ourl.href));
		}else{ res.writeHead(404); res.end(); }
	}).listen(sport, logcb('server running...'));
}
const init = async()=>{
	let uname,tname,t,u,port,sport,skey,scert,mport,mkey,mcert,bind='0.0.0.0';
	const rl=readline.createInterface({input:process.stdin, output:process.stdout});
	const q=(text,answer)=>new Promise(res=>rl.question(text,res)).then(answer);
	await q('access token(*): ', i=>t=i);
	await q('server url(*): ', i=>u=i);
	await q('certifcate issuer(*) [magent]: ', i=>ca.gen(i,2).then(e=>[skey,scert,mkey,mcert]=e));
	await q(`server port [443]: `, i=>sport=parseInt(i||443));
	await q(`proxy port [6580]: `, i=>port=parseInt(i||6580));
	await q(`mitm port [65443]: `, i=>mport=parseInt(i||65443));
	await q(`http header uname [magent-u]: `, i=>uname=i||'magent-u');
	await q(`http header tname [magent-t]: `, i=>tname=i||'magent-t');
	rl.close();
	fs.writeFileSync('./server.json', JSON.stringify({uname,tname,t,sport,skey,scert}));
	fs.writeFileSync('./config.json', JSON.stringify({uname,tname,u,t,bind,port,mport,mkey,mcert,scert}));
	fs.writeFileSync('./ca.crt', mcert);
}
switch(process.argv[2]){
	case 'proxy': proxy(); break;
	case 'server': server(); break;
	case 'init': init(); break;
	default: logcb()
(`Magent v1.0.1

Setup: magent init
Server: magent server
Client: magent proxy
Notice:
  Only the HTTP(s) message can pass throuth this proxy
  Import the root certifcate 'ca.crt' to your system or browser to let it work

Copyright (c) 2019 DNetL <DNetL@pm.me>;
Report Magent translation bugs to <https://github.com/DNetL/magent/issues>`);
}