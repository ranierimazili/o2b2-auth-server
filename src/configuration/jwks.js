import fs from 'fs';
import { createPrivateKey } from 'crypto';
import * as jose from 'jose';
import * as selfsigned from 'selfsigned';

//Lista os arquivos presentes nos diretórios de certificados (certs/sig e certs/enc) e
//carrega o conteúdo de cada arquivo, retornando um objeto com os certificados
//de assinatura e criptografia
//Caso não existam certificados, cria certificados auto-assinados
const getCertificates = async function() {
	const sigDir = "./certs/sig";
	const encDir = "./certs/enc";
	
	const sigFileNames = fs.readdirSync(sigDir).filter(file => file !== 'README.md').sort();
	const encFileNames = fs.readdirSync(encDir).filter(file => file !== 'README.md').sort();

	let sigFiles = [];
	let encFiles = [];
	
	if (sigFileNames.length === 0) {
		console.warn("Não foi encontrado o certificado de assinatura em certs/sig. Gerando certificado auto-assinado.");
		const ssSigKey = selfsigned.generate(null, { days: 365, keySize: 2048 });
		sigFiles.push(ssSigKey.private);
	} else {
		sigFiles = sigFileNames.map(file => (fs.readFileSync(`${sigDir}/${file}`)));
	}

	if (encFileNames.length === 0) {
		console.warn("Não foi encontrado o certificado de criptografia em certs/enc. Gerando certificado auto-assinado.");
		const ssEncKey = selfsigned.generate(null, { days: 365, keySize: 2048 });
		encFiles.push(ssEncKey.private);
	} else {
		encFiles = encFileNames.map(file => (fs.readFileSync(`${encDir}/${file}`)));
	}

	return { sigFiles, encFiles }
}

//Converte um certificado em formato PEM para JWK
const convertPemToJwk = async function(pem) {
	const key = createPrivateKey(pem);
	const privateJwk = await jose.exportJWK(key);
	return privateJwk;
}

//Faz a conversão de todos os certificados lidos do formato PEM para JWK, incluindo
//o atributo 'use' para definição da sua funcionalidade e retorna um objeto único
//contendo as chaves de assinatura e criptografia
const generateJwkKeys = async function(certs) {
	const sigJwksKeys = await Promise.all(certs.sigFiles.map(async (cert) => ({ use: 'sig', ...await convertPemToJwk(cert)})));
	const encJwksKeys = await Promise.all(certs.encFiles.map(async (cert) => ({ use: 'enc', ...await convertPemToJwk(cert)})));
	const keys = { keys: sigJwksKeys.concat(encJwksKeys) };
	return keys;
}

export const getJwksKeys = async function() {
	const certs = await getCertificates();
	const keys = await generateJwkKeys(certs);
	return keys;
}