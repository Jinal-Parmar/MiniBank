const hexToBinary=require('hex-to-binary');
const Block=require('./block');
const {GENESIS_DATA,MINE_RATE}=require('../config');
//const cryptoHash=require('../util/crypto-hash');
const {cryptoHash}=require('../util');
describe('Block',()=>{

   const timestamp=2000;
   const lastHash='foo-hash';
   const hash='bar-hash';
   const difficulty=1;
   const nonce=1;
   const data=['blockchain','data'];
   const block=new Block({
   	timestamp,lastHash,hash,data,nonce,difficulty
   });

  it('has a timestamp,lastHash,hash and data property',()=>{

 expect(block.timestamp).toEqual(timestamp);
 expect(block.lastHash).toEqual(lastHash);
 expect(block.hash).toEqual(hash);
 expect(block.data).toEqual(data);
 expect(block.nonce).toEqual(nonce);
 expect(block.difficulty).toEqual(difficulty);

  });


  //static fun
  describe('genesis()',()=>{
     
     const genesisBlock=Block.genesis();

   
 	 it('returns a Block instance',()=>{
       expect(genesisBlock instanceof Block).toBe(true);
       });


 	 it('returns genesis data',()=>{
       expect(genesisBlock).toEqual(GENESIS_DATA);
       });
 	  
  });


describe('mineBlock',()=>{
  const lastBlock=Block.genesis();
  const data='mined data';
  const minedBlock=Block.mineBlock({lastBlock,data});

it('returns a Block instance',()=>{
       expect(minedBlock instanceof Block).toBe(true);
       });

it('sets `lastHash to be `hash` of lastBlock',()=>{
       expect(minedBlock.lastHash).toEqual(lastBlock.hash);
       });

it('sets `data`',()=>{
       expect(minedBlock.data).toEqual(data);
       });
it('sets `timestamp`',()=>{
       expect(minedBlock.timestamp).not.toEqual(undefined);
       });

it('creates a SHA-256 `hash` based on  proper inputs',()=>{
	expect(minedBlock.hash).toEqual(
		cryptoHash(
			minedBlock.timestamp,
			minedBlock.nonce,
			minedBlock.difficulty,
			lastBlock.hash,
			data));
});

it('sets a `hash` that matches the difficulty criteria',()=>{
 expect(hexToBinary(minedBlock.hash).substring(0,minedBlock.difficulty)).toEqual('0'.repeat(minedBlock.difficulty));
});


it('adjust the Difficulty',()=>{
 const possibleResults=[lastBlock.difficulty+1,lastBlock.difficulty-1];
 
 expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
});

});


describe('adjustDifficulty()',()=>{

	it('raises difficulty for quickly mined block',()=>{
    
     expect(Block.adjustDifficulty({
     	originalBlock:block,timestamp:block.timestamp+MINE_RATE-100
     })).toEqual(block.difficulty+1);
     });

	it('lowers difficulty for slowly mined block',()=>{
	expect(Block.adjustDifficulty({
		originalBlock:block,timestamp:block.timestamp+MINE_RATE+100
	})).toEqual(block.difficulty-1);
	});

	it('has a lower limit of 1',()=>{
    block.difficulty=-1;
    expect(Block.adjustDifficulty({originalBlock:block})).toEqual(1);
	});
});


});