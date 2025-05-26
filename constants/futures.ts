import { getAddress } from 'viem'

export const WHITELISTED_FUTURES_ASSETS: {
  address: `0x${string}`
  priceFeedId: `0x${string}`
}[] = [
  // '0x1D074e003E222905e31476A8398e36027141915b', // MON-TGE
  // '0xcaeF04f305313080C2538e585089846017193033', // USOILSPOT
  // '0xCAfFD292a5c578Dbd4BBff733F1553bF2cD8850c', // XAU
  // '0x746e48E2CDD8F6D0B672adAc7810f55658dC801b', // EUR
  // '0x5F433CFeB6CB2743481a096a56007a175E12ae23', // BTC
  // '0x53E2BB2d88DdC44CC395a0CbCDDC837AeF44116D', // AAPL
  // '0xd57e27D90e04eAE2EEcBc63BA28E433098F72855', // GOOGL
  // '0xDB1Aa7232c2fF7bb480823af254453570d0E4A16', // TSLA
  // '0x24A08695F06A37C8882CD1588442eC40061e597B', // BRK-A
  // '0x41DF9f8a0c014a0ce398A3F2D1af3164ff0F492A', // US30Y
  // leverage
  {
    address: '0xeC884fE8dF2DC08d6D6f2eB671351E10a14bAe7c', // US30Y-30x-250901
    priceFeedId:
      '0x8bf751ac2e5b0b9b4475da0b7caec7e9b69ceea003d0889fdd459b5cc86dcfe0',
  },
  {
    address: '0x0dD6aD59ff939E59fbc9091F4Bc5069a10376ebD', // EUR-20x-250901
    priceFeedId:
      '0x10a18e05717e8009a15e85942861fa19d2b67f9229a9e440882da0cbb58e1f1d',
  },
  {
    address: '0x33eE70f46A8Cd6fA67bfD0B4710d05e65AaEd37A', // S&P500-10x-250901
    priceFeedId:
      '0x69ee62be35957114caa10652dd5943262d1a87f31dcb0b10479900d6668cc3da',
  },
  {
    address: '0xa7bff4fBA9719863912D528bB294b5018542D81f', // XAU-10x-250901
    priceFeedId:
      '0xe378fda9cd3ad8b611e967c98d7cff8af4b7f95e0cf2f4b0c6cd28dd66f2924a',
  },
  {
    address: '0x78f2Fe42776C3f84Bd0fa26fdBd24AE9beb09c7D', // ETHBTC-5x-250901
    priceFeedId:
      '0xf1796dec946156e83a1cbdf898a3c570455b1585f08a09cd6691b0b9b2c40b3b',
  },
  {
    address: '0x07C656794dd6bc0953e363C11cCFD3d8dB306A12', // BTC-3x-250901
    priceFeedId:
      '0x12b111d5b83e163086082a8affd8bedc95a31116890677e379e1da51e6c57baa',
  },
  {
    address: '0x5523d21554Eab9ab6164b9ceb5ff9736feA26206', // USOIL-5x-250901
    priceFeedId:
      '0x0faed118cb59f1cf653539bc909fb5397021a1ad2b2af69937d445c7dae1dd4a',
  },
].map(({ address, priceFeedId }) => {
  return {
    address: getAddress(address),
    priceFeedId: priceFeedId as `0x${string}`,
  }
})

export const TRADING_VIEW_SYMBOLS: {
  [assetId in string]: string
} = {
  '0x24d84a7ab973231e4394015ece17a2155174123be2f8e38c751e17fbd2fcedad':
    'USOILSPOT',
  '0x30a19158f5a54c0adf8fb7560627343f22a1bc852b89d56be1accdc5dbf96d0e':
    'XAUUSD',
  '0xc1b12769f6633798d45adfd62bfc70114839232e2949b01fb3d3f927d2606154':
    'EURUSD',
  '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b':
    'BINANCE:BTCUSDT',
  '0xafcc9a5bb5eefd55e12b6f0b4c8e6bccf72b785134ee232a5d175afd082e8832':
    'NASDAQ:AAPL',
  '0x545b468a0fc88307cf64f7cda62b190363089527f4b597887be5611b6cefe4f1':
    'NASDAQ:GOOGL',
  '0x7dac7cafc583cc4e1ce5c6772c444b8cd7addeecd5bedb341dfa037c770ae71e':
    'NASDAQ:TSLA',
  '0xb3eaa2aef31b2999827f2183b5dded7553bf036cc927f1d60cf824f5ea1d428a':
    'NYSE:BRK.A',
  '0xf3030274adc132e3a31d43dd7f56ac82ae9d673aa0c15a0ce15455a9d00434e6': 'US30Y',
}
