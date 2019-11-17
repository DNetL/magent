const forge = require('node-forge');
const fs = require('fs');
const pki = forge.pki;
const ROOTCN = 'MAGENT';
const certMaps = [];
let caKey,caCert;

const genCA= (keyPath='./ca.key', certPath='./ca.crt')=>{
	const time= Date.now();
	const kpair= pki.rsa.generateKeyPair(2046);
	caKey= kpair.privateKey;
	fs.writeFileSync(keyPath, pki.privateKeyToPem(caKey));

	caCert= pki.createCertificate();
	Object.assign(caCert, {publicKey:kpair.publicKey, serialNumber:time+''});
	Object.assign(caCert.validity, {notBefore:new Date(time-86400000), notAfter:new Date(time+86400000000)});
	caCert.setSubject([{shortName:'CN', value:ROOTCN}]);
	caCert.setIssuer([{shortName:'CN', value:ROOTCN}]);
	caCert.setExtensions([{name:'basicConstraints', critical:true, cA:true}]);
	caCert.sign(caKey, forge.md.sha256.create());
	fs.writeFileSync(certPath, pki.certificateToPem(caCert));
}
const genCert= (hostname,save)=>{
	if(certMaps[hostname]) return certMaps[hostname];
	const time= Date.now()
	const kpair= pki.rsa.generateKeyPair(2046);
	const cert= pki.createCertificate();
	Object.assign(cert, {publicKey:kpair.publicKey, serialNumber:time+''});
	Object.assign(cert.validity, {notBefore:new Date(time-86400000), notAfter:new Date(time+86400000)});
	cert.setSubject([{shortName:'CN', value:hostname}]);
	cert.setIssuer(caCert.subject.attributes);
	cert.setExtensions([{name:'subjectAltName', altNames:[{type:2, value:hostname}]}]);
	cert.sign(caKey, forge.md.sha256.create());
	if(save){
		fs.writeFileSync(`${hostname}.key`, pki.privateKeyToPem(kpair.privateKey));
		fs.writeFileSync(`${hostname}.cert`, pki.certificateToPem(cert));
	}
	return certMaps[hostname]={key:pki.privateKeyToPem(kpair.privateKey), cert:pki.certificateToPem(cert)};
}
const load= (keyPath='./ca.key', certPath='./ca.crt')=>{
	try{
		caKey= pki.privateKeyFromPem(fs.readFileSync(keyPath));
		caCert= pki.certificateFromPem(fs.readFileSync(certPath));
	}catch(e){ genCA(keyPath, certPath); }
}
module.exports= {genCA, genCert, load};