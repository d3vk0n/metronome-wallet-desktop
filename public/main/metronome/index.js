const logger = require('electron-log')
const promiseAllProps = require('promise-all-props')

const { getWeb3, sendTransaction } = require('../ethWallet')

const { getAuctionStatus } = require('./auctions')
const { registerTxParser } = require('../ethWallet')
const {
  encodeConvertEthToMtn,
  encodeConvertMtnToEth,
  getConverterStatus
} = require('./converter')
const { transactionParser } = require('./transactionParser')
const { getAuctionAddress, getConverterAddress } = require('./settings')

// TODO move all subscription code to a single place in ethWallet

let subscriptions = []

function sendStatus ({ web3, webContents }) {
  promiseAllProps({
    auctionStatus: getAuctionStatus({ web3, address: getAuctionAddress() }),
    converterStatus: getConverterStatus({ web3, address: getConverterAddress() })
  })
    .then(function ({ auctionStatus, converterStatus }) {
      logger.verbose('Metronome status', auctionStatus, converterStatus)

      webContents.send('auction-status-updated', auctionStatus)
      webContents.send('mtn-converter-status-updated', converterStatus)
    })
    .catch(function (err) {
      logger.warn('Could not get metronome status', err)

      // TODO retry before notifying

      webContents.send('connectivity-state-changed', {
        ok: false,
        reason: 'Call to Ethereum node failed',
        plugin: 'metronome',
        err: err.message
      })
    })
}

function listenForBlocks (_, webContents) {
  const web3 = getWeb3()

  sendStatus({ web3, webContents })

  const blocksSubscription = web3.eth.subscribe('newBlockHeaders')

  blocksSubscription.on('data', function (header) {
    logger.verbose('New block header', header.number)

    // TODO throttle this to 30'

    sendStatus({ web3, webContents })
  })

  blocksSubscription.on('error', function (err) {
    logger.error('Subscription error', err.message)

    // TODO notify error
  })

  webContents.on('destroyed', function () {
    blocksSubscription.unsubscribe()
  })

  subscriptions.push({ webContents, blocksSubscription })
}

function unsubscribeUpdates (_, webContents) {
  const toUnsubscribe = subscriptions.filter(s => s.webContents === webContents)

  toUnsubscribe.forEach(function (s) {
    logger.verbose('Unsubscribing auction status update')
    s.blocksSubscription.unsubscribe()
  })

  subscriptions = subscriptions.filter(s => s.webContents !== webContents)
}

function buyMetronome ({ password, from, value }) {
  const address = getAuctionAddress()

  logger.verbose('Buying MTN in auction', { from, value, address })

  return sendTransaction({ password, from, to: address, value, gasMult: 2 })
}

function convertEthToMtn ({ password, from, value }) {
  const web3 = getWeb3()
  const address = getConverterAddress()
  const data = encodeConvertEthToMtn({ web3, address, value })

  logger.verbose('Converting MTN to ETH', { from, value, address })

  return sendTransaction({ password, from, to: address, value, data, gasMult: 2 })
}

function convertMtnToEth ({ password, from, value }) {
  const web3 = getWeb3()
  const address = getConverterAddress()
  const data = encodeConvertMtnToEth({ web3, address, value })

  logger.verbose('Converting ETH to MTN', { from, value, address })

  return sendTransaction({ password, from, to: address, value, data, gasMult: 2 })
}

function getHooks () {
  registerTxParser(transactionParser)

  return [{
    eventName: 'ui-ready',
    handler: listenForBlocks
  }, {
    eventName: 'ui-unload',
    handler: unsubscribeUpdates
  }, {
    eventName: 'mtn-buy',
    auth: true,
    handler: buyMetronome
  }, {
    eventName: 'mtn-convert-eth',
    auth: true,
    handler: convertEthToMtn
  }, {
    eventName: 'mtn-convert-mtn',
    auth: true,
    handler: convertMtnToEth
  }]
}

module.exports = { getHooks }
