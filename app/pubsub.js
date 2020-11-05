const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-d72e7920-2926-4443-a4a8-d6373042f5db',
  subscribeKey: 'sub-c-5eacbc52-b78d-11ea-875a-ceb74ea8e96a',
  secretKey: 'sec-c-OGE1M2YzN2EtZmY3Ni00MTlhLTg4YTYtZTUzOTg4NGViNTgw'
};

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN:'BLOCKCHAIN',
  TRANSACTION:'TRANSACTION'
};

class PubSub {
  constructor({blockchain,transactionPool,wallet}) {
    this.blockchain=blockchain;
    this.transactionPool=transactionPool;
    this.pubnub = new PubNub(credentials);
    this.wallet=wallet;
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

    this.pubnub.addListener(this.listener());
  }

  
  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

    
          switch(channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransactions(
                { chain: parsedMessage }
              );
            });
            break;
          case CHANNELS.TRANSACTION:
            if (!this.transactionPool.existingTransaction({
              inputAddress: this.wallet.publicKey
            })) {
              this.transactionPool.setTransaction(parsedMessage);
            }
            break;
          default:
            return;
        }
        //if(channel==CHANNELS.BLOCKCHAIN)
       // {
       //    	this.blockchain.replaceChain(parsedMessage);
       // }
      }
    }
  }


  publish({ channel, message }) {
       //  this.pubnub.unsubscribe(channel,()=>{
       //  this.pubnub.publish(channel,message,()=>{
       // 	 this.pubnub.subscribe(channel);
       //    });
  	   // });
  	   // no call back :(
    this.pubnub.publish({ message, channel });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

   broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}


module.exports = PubSub;