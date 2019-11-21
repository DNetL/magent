const readline = require('readline');
const cajs = require('./ca.js');
const https = require('https');
const http = require('http');
const tls = require('tls');
const net = require('net');
const fs = require('fs');

const logcb = (...args)=>console.log.bind(this,...args);
const errcb = (...args)=>console.error.bind(this,...args);

const reqPipe = (url,opts,res)=>require(url.protocol.slice(0,-1))
	.request(url, opts, nRes=>{res.writeHead(nRes.statusCode, nRes.headers); nRes.pipe(res);})
	.on('error', e=>{res.writeHead(500); res.end(e.message);}).end();
const SNICallback = (host, cb)=>cajs.cert(host).then(kp=>cb(null, tls.createSecureContext(kp)));

const proxy = async(cpath,ca)=>{
	const {uname,tname,u,t,bind,port,mport,kpair,cert}=JSON.parse(fs.readFileSync(cpath));
	cajs.load(kpair);
	const reqHandle = o=>(req, res)=>{
		const {method, headers, url}=req;
		const ourl=o?url:`https://${headers.host}${url}`;
		const purl=new URL(u), id=Date.now(); headers.host=purl.host;
		reqPipe(purl, {ca:ca?'':cert, method, headers:{...headers,[uname]:ourl,[tname]:t}, minVersion:'TLSv1.3'}, res)
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
const server = async(spath)=>{
	const {uname,tname,t,port,kpair}=JSON.parse(fs.readFileSync(spath));
	cajs.load(kpair);
	https.createServer({SNICallback, minVersion:'TLSv1.3'}, (req, res)=>{
		const {method, headers}=req;
		if(headers[tname]===t){
			const ourl=new URL(headers[uname]), id=Date.now(); headers.host=ourl.host;
			for(let name of [tname,uname]) delete headers[name];
			reqPipe(ourl, {method,headers}, res)
				.on('socket', socket=>logcb(id)(method,ourl.href))
				.on('error', errcb(id,method,ourl.href));
		}else{ res.writeHead(404); res.end(); }
	}).listen(port, logcb('server running...'));
}
const init = async(cpath,apath,spath, uname,tname,t,u,port,sport,mport,bind='0.0.0.0')=>{
	const rl=readline.createInterface({input:process.stdin, output:process.stdout});
	const q=text=>new Promise(res=>rl.question(text,res));
	const [kpair,{key,cert}]=await cajs.gen(await q('Certifcate Issuer(*) [magent]: ')||'magent');
	u=u||await q('Server URL(*): ');
	sport=parseInt(sport||await q(`Server Port [443]: `)||443);
	port=parseInt(port||await q(`Proxy Port [6580]: `)||6580);
	mport=parseInt(mport||await q(`MITM Port [65443]: `)||65443);
	t=t||await q('Access Token [random]: ')||Math.random().toString(36).slice(2);
	uname=uname||await q(`UNAME [magent-u]: `)||'magent-u';
	tname=tname||await q(`TNAME [magent-t]: `)||'magent-t';
	rl.close();
	fs.writeFileSync(cpath, JSON.stringify({uname,tname,u,t,bind,port,mport,kpair,cert}));
	fs.writeFileSync(apath, kpair.cert);
	fs.writeFileSync(spath, JSON.stringify({uname,tname,t,port:sport,kpair:{key,cert}}));
	return {uname,tname,u,t,bind,port,sport,mport}
}
module.exports = { proxy, server, init };