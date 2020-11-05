const Blockchain=require('./index');
const Block=require('./block');
const Wallet =require('../wallet');
const  Transaction=require('../wallet/transaction');
//const cryptoHash=require('../util/crypto-hash');
const {cryptoHash}=require('../util');
describe('Blockchain',()=>{

let blockchain,newchain,originalchain,errorMock;

beforeEach(()=>{
	blockchain=new Blockchain();
    newchain=new Blockchain();
    originalchain=blockchain.chain;
    errorMock=jest.fn();
    global.console.error=errorMock;
});

it('contains a `chain` array instance',()=>{
   expect(blockchain.chain  instanceof Array).toBe(true);

  	});

it('starts with the gensis block',()=>{
   expect(blockchain.chain[0]).toEqual(Block.genesis());

  	});

it('add new block to chain',()=>{
	const newData='foo bar';
   blockchain.addBlock({data:newData});

   expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);

    	});

describe('isValidChain()',()=>{

describe('when chain doesnot start with genesis block',()=>{
it('returns false',()=>{
	blockchain.chain[0]={data:'fake-genesis'};
	expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
});
});

describe('when chain  start with genesis block and has multiple blocks',()=>{
	beforeEach(()=>{
	   blockchain.addBlock({data:'Bears'});
       blockchain.addBlock({data:'Beets'});
       blockchain.addBlock({data:'Battlestar Galactica'});

	});
    describe('lasthash reference has changed ',()=>{
	    it('returns false',()=>{
	    blockchain.chain[2].lastHash='broken-lastHash';	
	    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
	    });
      });
 
    
    describe('chain contaisn block with invalid field ',()=>{
     	it('returns false',()=>{
         blockchain.chain[2]='some-bad-and-evil-data';
         expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
     	});
      });

    describe('chain contains a  block with a jumped difficulty',()=>{
    	it('returns false',()=>{
    		const lastBlock=blockchain.chain[blockchain.chain.length-1];
    		const lastHash=lastBlock.hash;
    		const timestamp=Date.now();
            const nonce=0;
            const data=[];
            const difficulty=lastBlock.difficulty-3;
            const hash=cryptoHash(timestamp,lastHash,difficulty,nonce,data);
            const badBlock= new Block({
            timestamp,lastHash,hash,nonce,difficulty,data
             });  

             blockchain.chain.push(badBlock);
             expect(Blockchain.isValidChain(blockchain.chain)).toBe(false); 
        });
    });

    describe('no invaild blocks ',()=>{
	    it('returns true',()=>{
         expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);	
	    });
      });
  });

});


describe('replaceChain()',()=>{ 
  	let logMock;
  	beforeEach(()=>{
  		logMock=jest.fn();
 
  		global.console.log=logMock;

  	});
  describe('when new chain is not longer',()=>{
  	beforeEach(()=>{
  	    newchain.chain[0]={new:'chain'};
  		blockchain.replaceChain(newchain.chain);
  	});
  	it('does not replace chain',()=>{
  	    expect(blockchain.chain).toEqual(originalchain);
  	});
  	it('logs error',()=>{
  		expect(errorMock).toHaveBeenCalled();
  	});
  
  });

  describe('when new chain is  longer',()=>{
  	beforeEach(()=>{
	 newchain.addBlock({data:'Bears'});
     newchain.addBlock({data:'Beets'});
     newchain.addBlock({data:'Battlestar Galactica'});
 
    });
      describe('when chain is invlaid',()=>{
  	  beforeEach(()=>{
        newchain.chain[2].hash='some-fake-hash';
        blockchain.replaceChain(newchain.chain);
  	  });
  	  it('does not replace chain',()=>{
      expect(blockchain.chain).toEqual(originalchain);
  	  });	  
      it('logs error',()=>{
  		expect(errorMock).toHaveBeenCalled();
  	  });
     });
     
     describe('when chain is valid',()=>{
  	  beforeEach(()=>{
  	     blockchain.replaceChain(newchain.chain);
  	  });
  	  it('replaces chain',()=>{
       expect(blockchain.chain).toEqual(newchain.chain);
  	  });
      it('logs about chain replacement',()=>{
  		expect(logMock).toHaveBeenCalled();
  	  });
      });

  });


});

  describe('and the `validateTransactions` flag is true', () => {
      it('calls validTransactionData()', () => {
        const validTransactionDataMock = jest.fn();

        blockchain.validTransactionData = validTransactionDataMock;

        newchain.addBlock({ data: 'foo' });
        blockchain.replaceChain(newchain.chain, true);

        expect(validTransactionDataMock).toHaveBeenCalled();
      });
    });







describe('validTransactionData()', () => {
    let transaction, rewardTransaction, wallet;

    beforeEach(() => {
      wallet = new Wallet();
      transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
      rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
    });

    describe('and the transaction data is valid', () => {
      it('returns true', () => {
        newchain.addBlock({ data: [transaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(true);
        expect(errorMock).not.toHaveBeenCalled();
      });
    });

    describe('and the transaction data has multiple rewards', () => {
      it('returns false and logs an error', () => {
        newchain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false and logs an error', () => {
          transaction.outputMap[wallet.publicKey] = 999999;

          newchain.addBlock({ data: [transaction, rewardTransaction] });

          expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction is a reward transaction', () => {
        it('returns false and logs an error', () => {
          rewardTransaction.outputMap[wallet.publicKey] = 999999;

          newchain.addBlock({ data: [transaction, rewardTransaction] });

          expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs an error', () => {
        wallet.balance = 9000;

        const evilOutputMap = {
          [wallet.publicKey]: 8900,
          fooRecipient: 100
        };

        const evilTransaction = {
          input: {
            timestamp: Date.now(),
            amount: wallet.balance,
            address: wallet.publicKey,
            signature: wallet.sign(evilOutputMap)
          },
          outputMap: evilOutputMap
        }

        newchain.addBlock({ data: [evilTransaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and a block contains multiple identical transactions', () => {
      it('returns false and logs an error', () => {
        newchain.addBlock({
          data: [transaction, transaction, transaction, rewardTransaction]
        });

        expect(blockchain.validTransactionData({ chain: newchain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });
  });


});