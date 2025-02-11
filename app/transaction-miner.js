  const Transaction = require('../wallet/transaction');

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;


  }

  mineTransactions() {
 // get transaction pool's valid transaction

    const validTransactions = this.transactionPool.validTransactions();
  //genrate miner's reward
  validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );
  //add a block consisting of these transactions to blockchain
    this.blockchain.addBlock({ data: validTransactions });
 //broadcast updated blockchain
    this.pubsub.broadcastChain();
//clear pool
    this.transactionPool.clear();
  }
}

module.exports = TransactionMiner;