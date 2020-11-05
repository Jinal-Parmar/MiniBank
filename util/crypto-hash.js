
const crypto=require('crypto');
//const hexToBinary=require('hex-to-binary');
//crypto module already hai no need of path
const cryptoHash=(...inputs)=>{

	const hash=crypto.createHash('sha256');

	hash.update(inputs.map(input=>JSON.stringify(input)).sort().join(' '));

	return hash.digest('hex');
};
//spread operator n arguments
module.exports=cryptoHash;