const forge = require('node-forge');
const fs = require('fs');
const pki = forge.pki;
const certMaps = [];
let caKey, caCert;

const create = async(a)=>{
	const time = Date.now()
	const kpair = pki.rsa.generateKeyPair(2046);
	const cert = pki.createCertificate();
	Object.assign(cert, {publicKey:kpair.publicKey, serialNumber:time+''});
	Object.assign(cert.validity, {notBefore:new Date(time-864e5), notAfter:new Date(time+a)});
	return {key:kpair.privateKey, cert}
}
const gen = async(issuer='magent', num)=>{
	let i=0, ret=[];
	while(i++<num) await create(864e8).then(({key,cert})=>{
		cert.setSubject([{shortName:'CN', value:issuer}]);
		cert.setIssuer([{shortName:'CN', value:issuer}]);
		cert.setExtensions([{name:'basicConstraints', critical:true, cA:true}]);
		cert.sign(key, forge.md.sha256.create());
		ret.push(pki.privateKeyToPem(key), pki.certificateToPem(cert));
	});
	return ret;
}
const cert = async(host)=>{
	return certMaps[host]||create(864e6).then(({key,cert})=>{
		cert.setSubject([{shortName:'CN', value:host}]);
		cert.setIssuer(caCert.subject.attributes);
		cert.setExtensions([{name:'subjectAltName', altNames:[{type:2, value:host}]}]);
		cert.sign(caKey, forge.md.sha256.create());
		return certMaps[host]={key:pki.privateKeyToPem(key), cert:pki.certificateToPem(cert)};
	});
}
const load = (key,cert)=>{
	caKey = pki.privateKeyFromPem(key);
	caCert = pki.certificateFromPem(cert);
}
module.exports = { gen, cert, load };