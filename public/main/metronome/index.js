const logger = require('electron-log')
const promiseAllProps = require('promise-all-props')
const settings = require('electron-settings')

const { getWeb3, sendSignedTransaction } = require('../ethWallet')

let listening = false

const auctionsAbi = require('./contracts/Auctions')

function listenForBlocks (_, webContents) {
  if (listening) {
    return
  }

  listening = true

  const web3 = getWeb3()

  const blocksSubscription = web3.eth.subscribe('newBlockHeaders')

  const auctionsAddress = settings.get('metronome.contracts.auctions')
  const auctions = new web3.eth.Contract(auctionsAbi, auctionsAddress)

  blocksSubscription.on('data', function (header) {
    logger.debug('New block header', header.number)

    // TODO throttle this to 30'

    const calls = {
      genesisTime: auctions.methods.genesisTime().call().then(t => Number.parseInt(t, 10)),
      currentPrice: auctions.methods.currentPrice().call(),
      tokenRemaining: auctions.methods.mintable().call().then(t => Number.parseInt(t, 10)),
      nextAuctionStartTime: auctions.methods.nextAuction().call().then(data => data._startTime)
    }

    promiseAllProps(calls).then(function (auctionStatus) {
      logger.debug('Auction status', auctionStatus)

      webContents.send('auction-status-updated', auctionStatus)
    })
  })

  blocksSubscription.on('error', function (err) {
    logger.error('Subscription error', err.message)

    // TODO notify error
  })
}

function buyMetronome ({ password, from, value }) {
  const address = settings.get('metronome.contracts.auctions')

  logger.debug('Buying MTN in auction', { from, value, address })
  
  // TODO estimate gas with transfer.estimateGas()
  const gas = 200000

  return sendSignedTransaction({ password, from, to: address, gas })
}

function getHooks () {
  return [{
    eventName: 'ui-ready',
    handler: listenForBlocks
  }, {
    eventName: 'mtn-buy',
    handler: buyMetronome
  }]
}

module.exports = { getHooks }