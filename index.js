#!/usr/bin/env node
const readline = require('readline');
const http = require('http');
const https = require('https');
const ca = require('./ca.js');
const tls = require('tls');
const net = require('net');
const fs = require('fs');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);

const reqPipe= (url,opts,res)=>require(url.protocol.slice(0,-1))
	.request(url, opts, nRes=>{res.writeHead(nRes.statusCode, nRes.headers); nRes.pipe(res);})
	.on('error', e=>{res.writeHead(500); res.end(e.message);}).end();
const reqHandle= proxy=>(req, res)=>{
	const {method, headers, url}=req;
	const ourl=proxy?url:`https://${headers.host}${url}`;
	const purl=new URL(u); headers.host=purl.host;
	const id=Date.now();
	reqPipe(purl, {method, headers:{...headers,[uname]:ourl,[tname]:t}, minVersion:'TLSv1.3'}, res)
		.on('socket', socket=>logcb(id)(method,socket.getProtocol(),ourl))
		.on('error', errcb(id,method,ourl));
}
const SNICallback= (hostname, cb)=>cb(null, tls.createSecureContext(ca.genCert(hostname)));
const proxy= async(i)=>{
	await load(i, './config.json', async(q)=>{
		await q('token(*): ', i=>t=i);
		await q('url(*): ', i=>u=i);
		await q(`bind address [${addr}]: `, i=>addr=i||addr);
		await q(`bind port [${port}]: `, i=>port=parseInt(i||port));
		await q(`mitm port [${mitm}]: `, i=>mitm=parseInt(i||mitm));
		await q(`uname [${uname}]: `, i=>uname=i||uname);
		await q(`tname [${tname}]: `, i=>tname=i||tname);
		await q(`root ca key path [${key}]: `, i=>key=i||key);
		await q(`root ca cert path [${cert}]: `, i=>cert=i||cert);
		return {addr,port,mitm,uname,tname,u,t,key,cert};
	}, config=>({addr,port,mitm,uname,tname,u,t,key,cert}=config));
	ca.load(key,cert);
	https.createServer({SNICallback}, reqHandle(false))
	.listen(mitm, addr, ()=>http.createServer(reqHandle(true)).on('connect', (req, socket, head)=>{
		net.connect(mitm, addr, function(){
			socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
			this.write(head);
			this.pipe(socket).pipe(this);
		}).on('error', errcb('mitm[error]'));
	}).listen(port, addr, logcb('proxy running...')));
}
const server= async(i)=>{
	await load(i, './server.json', async(q)=>{
		await q('token(*): ', i=>t=i);
		await q(`bind address [${addr}]: `, i=>addr=i||addr);
		await q('bind port [443]: ', i=>port=parseInt(i||443));
		await q(`uname [${uname}]: `, i=>uname=i||uname);
		await q(`tname [${tname}]: `, i=>tname=i||tname);
		await q(`ca key path [${key}]: `, i=>key=i||key);
		await q(`ca cert path [${cert}]: `, i=>cert=i||cert);
		return {addr,port,uname,tname,t,key,cert};
	}, config=>({addr,port,uname,tname,t,key,cert}=config));
	ca.load(key,cert);
	https.createServer({SNICallback, minVersion:'TLSv1.3'}, (req, res)=>{
		const {method, headers}=req;
		if(headers[tname]===t){
			const ourl=new URL(headers[uname]); headers.host=ourl.host;
			for(let name of [tname,uname]) delete headers[name];
			const id=Date.now();
			reqPipe(ourl, {method,headers}, res)
				.on('socket', socket=>logcb(id)(method,socket.getProtocol(),ourl.href))
				.on('error', errcb(id,method,ourl.href));
		}else{ res.writeHead(404); res.end(); }
	}).listen(port, addr, logcb('server running...'));
}
const load= async(i, name, init, read)=>{
	if(i){
		const rl=readline.createInterface({input:process.stdin, output:process.stdout});
		const q=(text,answer)=>new Promise(res=>rl.question(text,res)).then(answer);
		await init(q).then(config=>{rl.close(); fs.writeFileSync(name, JSON.stringify(config));});
	} else await read(JSON.parse(fs.readFileSync(name)));
}

let {addr,port,u,t,key,cert,mitm,uname,tname,_}= require('minimist')(process.argv.slice(2),{
	alias:{p:'port', b:'addr', k:'key', c:'cert', u:'url', t:'token'},
	default:{
		p:6580, b:'0.0.0.0', k:'./ca.key', c:'./ca.crt',
		mitm:65443, uname:'da-url', tname:'da-tk'
	}
});
try{https.globalAgent.options.ca=[fs.readFileSync(cert)];}catch(e){}

if(_.includes('gen')) ca.genCA(key,cert);
else if(_.includes('server')) server(_.includes('init'));
else if(_.includes('proxy')) proxy(_.includes('init'));