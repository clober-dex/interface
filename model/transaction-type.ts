export type TransactionType =
  | 'approve' // approve erc20 token
  | 'mint' // add liquidity into the pool
  | 'burn' // remove liquidity from the pool
  | 'register' // register for trading competition
  | 'borrow' // borrow a futures asset
  | 'repay' // repay a futures asset
  | 'repay-all' // repay all a futures asset
  | 'settle' // settle a futures asset
  | 'close' // close a futures asset
  | 'redeem' // redeem a futures asset
  | 'add-collateral' // add collateral to a futures asset
  | 'remove-collateral' // remove collateral from a futures asset
  | 'make' // make a limit order
  | 'take' // take a limit order
  | 'open' // open a book
  | 'limit' // limit order
  | 'cancel' // cancel limit order(s)
  | 'claim' // claim limit order(s)
  | 'market' // market order
  | 'swap' // swap from aggregator
  | 'transfer' // transfer currency
