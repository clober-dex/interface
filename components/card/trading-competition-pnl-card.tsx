import React, { useMemo } from 'react'
import html2canvas from 'html2canvas'

import Modal from '../modal/modal'
import { shortAddress } from '../../utils/address'
import { TradingCompetitionPnl } from '../../model/trading-competition-pnl'
import { CurrencyIcon } from '../icon/currency-icon'
import { Chain } from '../../model/chain'
import { CHAIN_CONFIG } from '../../chain-configs'
import { formatWithCommas } from '../../utils/bignumber'

const CloberSVG = () => (
  <div className="flex flex-row gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="29"
      height="28"
      viewBox="0 0 29 28"
      fill="none"
    >
      <path
        d="M10.6402 18.7136C10.329 18.7136 10.0059 18.5952 9.7665 18.3583C9.28779 17.8844 9.28779 17.1026 9.7665 16.6288L15.8581 10.5993C16.3368 10.1254 17.1267 10.1254 17.6054 10.5993C18.0841 11.0731 18.0841 11.8549 17.6054 12.3288L11.5138 18.3583C11.2744 18.5952 10.9513 18.7136 10.6402 18.7136Z"
        fill="white"
      />
      <path
        d="M26.6288 18.2042L22.2366 13.8568C22.1768 13.7975 22.1169 13.7501 22.069 13.6909L20.2021 15.4441C20.2619 15.4915 20.3217 15.5507 20.3816 15.5981L24.8097 19.981C25.444 20.6089 25.7551 21.4262 25.7551 22.2436C25.7551 23.0609 25.444 23.8902 24.8097 24.518C23.5411 25.7736 21.4946 25.7736 20.226 24.518L15.8338 20.1706C15.8099 20.1469 15.786 20.1113 15.75 20.0876L15.4868 19.827L13.8472 21.8053C13.895 21.8645 13.9549 21.9237 14.0147 21.9711L18.4069 26.3185C20.6688 28.5574 24.3669 28.5574 26.6288 26.3185C28.8907 24.1034 28.8907 20.4549 26.6288 18.2042Z"
        fill="white"
      />
      <path
        d="M8.17468 12.6007C8.07894 12.5296 7.99516 12.4467 7.91139 12.3638L3.5192 8.0164C2.88491 7.38857 2.57375 6.57121 2.57375 5.75385C2.57375 4.93649 2.88491 4.10729 3.5192 3.47946C4.78779 2.2238 6.83429 2.2238 8.10287 3.47946L12.4951 7.82687C12.519 7.85056 12.5429 7.8861 12.5788 7.90979L12.9139 8.24147L14.7211 6.45275C14.6014 6.29876 14.4697 6.15661 14.3261 6.01446L9.92198 1.6789C7.66006 -0.559958 3.96201 -0.559958 1.7001 1.6789C-0.561817 3.91775 -0.561817 7.57811 1.7001 9.81696L6.09228 14.1644C6.2359 14.3065 6.37951 14.4368 6.53509 14.5553L8.34223 12.7666L8.17468 12.6007Z"
        fill="white"
      />
      <path
        d="M24.7377 16.3322L22.9066 18.1327L20.2139 15.4674L22.033 13.655L24.7377 16.3322Z"
        fill="url(#paint0_linear_2067_620)"
      />
      <path
        d="M18.3229 22.6698L16.5038 24.4703L13.811 21.7655L15.6301 19.9498L18.3229 22.6698Z"
        fill="url(#paint1_linear_2067_620)"
      />
      <path
        d="M3.63867 11.736L5.45778 9.92358L8.21037 12.6481L6.3793 14.4487L3.63867 11.736Z"
        fill="url(#paint2_linear_2067_620)"
      />
      <path
        d="M10.0291 5.39871L11.8601 3.59814L14.6008 6.27769L12.7816 8.12324L10.0291 5.39871Z"
        fill="url(#paint3_linear_2067_620)"
      />
      <path
        d="M12.5066 20.158L8.11442 24.5054C6.84583 25.7611 4.79933 25.7611 3.53075 24.5054C2.92039 23.9013 2.58529 23.0958 2.58529 22.231C2.58529 21.3663 2.92039 20.5726 3.53075 19.9685L7.92293 15.6211C7.95883 15.5856 7.99474 15.55 8.04261 15.5145L11.3457 12.245C10.9747 12.174 10.6037 12.1384 10.2088 12.1384C8.65297 12.1384 7.1929 12.7426 6.09186 13.8205L1.69967 18.1679C0.598634 19.2578 0.000244141 20.7029 0.000244141 22.2429C0.000244141 23.7828 0.610602 25.228 1.69967 26.3178C2.83661 27.4432 4.32062 27.9999 5.80463 27.9999C7.28864 27.9999 8.78461 27.4432 9.92156 26.3178L14.3137 21.9704C15.4148 20.8806 16.0132 19.4354 16.0132 17.8955C16.0132 17.5046 15.9773 17.1255 15.9055 16.7583L12.722 19.9093C12.6622 19.9922 12.5904 20.0751 12.5066 20.158Z"
        fill="white"
      />
      <path
        d="M26.5088 1.76166C24.2469 -0.477194 20.5488 -0.477194 18.2869 1.76166L13.8947 6.10907C12.4705 7.50687 11.944 9.47327 12.315 11.2975L15.4864 8.17024C15.5582 8.07547 15.642 7.99255 15.7258 7.90963L20.106 3.56222C20.7403 2.93439 21.5661 2.6264 22.3919 2.6264C23.2176 2.6264 24.0554 2.93439 24.6897 3.56222C25.9583 4.81788 25.9583 6.84351 24.6897 8.09916L20.2975 12.4347C20.2736 12.4584 20.2376 12.4821 20.2137 12.5176L16.8867 15.8108C17.2577 15.8818 17.6406 15.9174 18.0116 15.9174C19.4956 15.9174 20.9916 15.3606 22.1286 14.2353L26.5207 9.88788C28.7827 7.64902 28.7827 4.00052 26.5088 1.76166Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear_2067_620"
          x1="23.8166"
          y1="17.2337"
          x2="21.1466"
          y2="14.5362"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.8" stopColor="#2864FF" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_2067_620"
          x1="17.4165"
          y1="23.5686"
          x2="14.7465"
          y2="20.8711"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.8" stopColor="#2864FF" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_2067_620"
          x1="4.58226"
          y1="10.8366"
          x2="7.29794"
          y2="13.5801"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.8" stopColor="#2864FF" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_2067_620"
          x1="10.9254"
          y1="4.49582"
          x2="13.6412"
          y2="7.23953"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.8" stopColor="#2864FF" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="91"
      height="24"
      viewBox="0 0 91 24"
      fill="none"
    >
      <path
        d="M36.6953 7.63647C38.9737 7.63647 40.8508 8.40554 42.3223 9.94409L42.5938 10.2332C43.9057 11.703 44.5605 13.5248 44.5605 15.6951C44.5605 17.8846 43.9152 19.7261 42.6221 21.2156L42.3545 21.5085C40.8827 23.0267 38.9949 23.7849 36.6953 23.7849C34.5394 23.7849 32.7449 23.1192 31.3164 21.7849L31.0361 21.5085C29.5649 19.9698 28.8301 18.0305 28.8301 15.6951C28.8301 13.3805 29.5648 11.4618 31.0361 9.94409L31.3203 9.66479C32.766 8.31235 34.5589 7.63648 36.6953 7.63647ZM71.3223 7.63647C73.6417 7.63656 75.4565 8.36305 76.7598 9.82007L76.9961 10.0955C78.1404 11.4987 78.7109 13.3356 78.7109 15.6013C78.7109 15.9796 78.6895 16.2966 78.6465 16.5515L78.6396 16.5945H67.1504C67.182 17.8982 67.6199 18.9668 68.4658 19.8035H68.4668C69.3463 20.6521 70.4239 21.0769 71.7031 21.0769C72.7858 21.0769 73.6776 20.8251 74.3818 20.325C75.0858 19.8249 75.6072 19.0733 75.9434 18.0662L75.959 18.0173L76.0078 18.0339L78.5811 18.9128L78.6279 18.9285L78.6133 18.9763C78.1653 20.3893 77.3326 21.5494 76.1172 22.4558V22.4568C74.9001 23.3433 73.4276 23.7849 71.7031 23.7849C69.5514 23.7849 67.7175 23.0581 66.2041 21.6042L66.2031 21.6033C64.7095 20.1265 63.9648 18.1448 63.9648 15.6638C63.9649 13.3495 64.6887 11.4316 66.1387 9.91382L66.4141 9.63745C67.8053 8.30435 69.4424 7.63647 71.3223 7.63647ZM50.0645 0.477295V10.1101C50.4742 9.4394 51.0837 8.87823 51.8945 8.42847L52.2393 8.24976C53.06 7.8615 54.0021 7.66776 55.0645 7.66772C57.3006 7.66772 59.0427 8.41588 60.2822 9.91577L60.5068 10.2019C61.594 11.6535 62.1357 13.4649 62.1357 15.6326C62.1357 17.966 61.4982 19.9043 60.2188 21.4431H60.2178C58.9363 22.9633 57.1851 23.7223 54.9697 23.7224C52.7348 23.7224 51.098 22.8952 50.0645 21.241V23.3142H47.0088V0.477295H50.0645ZM26.3936 0.477295V23.3142H23.3057V0.477295H26.3936ZM36.6953 10.3767C35.4574 10.3767 34.3956 10.7948 33.5078 11.6326L33.333 11.8054C32.434 12.7355 31.9815 14.0298 31.9814 15.6951C31.9814 17.3808 32.4334 18.6962 33.332 19.6472H33.333C34.2551 20.5795 35.3747 21.0457 36.6953 21.0457C38.0158 21.0457 39.1246 20.5798 40.0254 19.6482H40.0264L40.1934 19.4656C41.0026 18.5312 41.4092 17.2759 41.4092 15.6951C41.4091 14.0301 40.9464 12.7355 40.0264 11.8054H40.0254C39.1245 10.8527 38.0156 10.3767 36.6953 10.3767ZM54.5244 10.3767C53.287 10.3768 52.2638 10.7946 51.4512 11.6306L51.291 11.8035C50.454 12.7549 50.0332 14.0297 50.0332 15.6326C50.0332 17.2349 50.4538 18.5306 51.291 19.5242L51.4512 19.7009C52.264 20.5555 53.2872 20.9821 54.5244 20.9822C55.8656 20.9822 56.9422 20.4968 57.7578 19.5251L57.9062 19.3386C58.6238 18.3891 58.9844 17.1551 58.9844 15.6326C58.9844 14.0082 58.5734 12.7337 57.7578 11.8035V11.8025C56.9638 10.8523 55.8875 10.3767 54.5244 10.3767ZM71.3535 10.3455C70.18 10.3455 69.2196 10.7281 68.4678 11.4919H68.4668C67.7264 12.2238 67.3216 13.0946 67.248 14.1052H75.4932C75.4447 13.0798 75.112 12.2337 74.4961 11.5632L74.3672 11.4294C73.6592 10.709 72.6568 10.3455 71.3535 10.3455ZM90.0518 11.2009L89.9932 11.1921C89.5508 11.1297 89.1191 11.0984 88.6982 11.0984C87.3098 11.0984 86.277 11.4833 85.5908 12.2439C84.9038 13.0054 84.5557 14.1527 84.5557 15.6951V23.3142H81.4678V8.10815H84.4922V10.5867C84.949 9.71037 85.5351 9.04198 86.2559 8.58667C87.0277 8.09918 87.9488 7.8562 89.0156 7.8562C89.3575 7.85621 89.6888 7.88848 90.0098 7.9519L90.0518 7.95972V11.2009Z"
        fill="white"
        stroke="white"
        strokeWidth="0.10206"
      />
      <path
        d="M11.1655 1.8728C13.5608 1.8728 15.5829 2.47436 17.2261 3.68237L17.5288 3.90503C18.9962 5.02014 19.8076 6.17525 20.5288 8.05444L20.5571 8.12866L20.4829 8.15405L17.7729 9.09644L17.7026 9.12085L17.6763 9.05151C17.1149 7.60102 16.5272 6.78895 15.4087 5.95483H15.4077C14.2921 5.10355 12.8797 4.67554 11.1655 4.67554C9.24886 4.67564 7.59298 5.30622 6.19482 6.57007L5.91846 6.83179C4.46769 8.24654 3.73779 10.2365 3.73779 12.8123C3.73782 15.3877 4.4675 17.3875 5.91846 18.822L6.19482 19.0837C7.59297 20.3476 9.24888 20.9782 11.1655 20.9783C12.8789 20.9783 14.3013 20.5308 15.437 19.6404C16.0102 19.1811 16.4371 18.7886 16.8052 18.3171C17.1734 17.8455 17.4857 17.292 17.8267 16.5105L17.855 16.4451L17.9224 16.4695L20.5132 17.4109L20.5864 17.4373L20.5591 17.5105C20.1601 18.5655 19.7351 19.363 19.2007 20.0525C18.7332 20.6557 18.1835 21.1738 17.4995 21.7097L17.1978 21.9412C15.5545 23.1693 13.5418 23.781 11.1655 23.781C8.44866 23.7809 6.08963 22.9125 4.09229 21.1755L3.69775 20.8162C1.63512 18.8366 0.60696 16.1655 0.606934 12.8123C0.606934 10.5627 1.12587 8.58589 2.1665 6.88452L2.36475 6.57104C3.3033 5.13353 4.44954 4.03414 5.8042 3.27515L6.09814 3.11694C7.6773 2.2872 9.36688 1.87287 11.1655 1.8728Z"
        fill="white"
        stroke="white"
        strokeWidth="0.15309"
      />
    </svg>
  </div>
)

export const TradingCompetitionPnlCard = ({
  chain,
  userAddress,
  trades,
  onClose,
}: {
  chain: Chain
  userAddress: `0x${string}`
  trades: TradingCompetitionPnl['trades']
  onClose: () => void
}) => {
  const totalProfit = useMemo(
    () =>
      trades.reduce((acc, trade) => {
        return acc + trade.pnl
      }, 0),
    [trades],
  )

  const captureElementAndGetDataUrl = async () => {
    const captureElement = document.getElementById('pnl-capture-target')
    if (!captureElement) {
      return null
    }

    const canvas = await html2canvas(captureElement, {
      backgroundColor: null,
      useCORS: true,
    })
    return canvas.toDataURL('image/png')
  }

  const handleTextShare = (
    userAddress: `0x${string}`,
    profit: number,
    target: 'twitter' | 'telegram',
  ) => {
    const profitString =
      profit >= 0
        ? `+$${profit.toFixed(2)}`
        : `-$${Math.abs(profit).toFixed(2)}`
    const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`

    const message = `💰💰 Profit: ${profitString} \n ${shortAddress}\n\nTrade futures on Clober!\n\n${CHAIN_CONFIG.URL}/trading-competition`

    if (target === 'twitter') {
      const text = encodeURIComponent(message)
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    } else if (target === 'telegram') {
      const text = encodeURIComponent(message)
      window.open(`https://t.me/share/url?url=${text}`, '_blank')
    }
  }

  const handleDownload = async () => {
    const dataUrl = await captureElementAndGetDataUrl()
    if (!dataUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'trading-competition-pnl.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Modal show onClose={onClose} width={'720px'}>
      <div className="flex flex-col gap-4 sm:gap-7">
        <h1 className="font-bold text-sm sm:text-xl">My Rank</h1>
        <div
          id="pnl-capture-target"
          className="relative flex flex-col bg-black/30 p-8 bg-[url('../public/chain-configs/background/trading-competition-pnl-card-background.png')] bg-top w-full h-full bg-no-repeat bg-cover"
        >
          <div className="absolute inset-0 bg-black/40 z-0" />

          <div className="relative z-10 flex flex-col">
            <div className="flex mb-[56px]">
              <CloberSVG />
            </div>

            <div className="flex flex-col gap-2 mb-[30px]">
              <div className="self-stretch justify-start text-white text-xl font-semibold">
                {shortAddress(userAddress, 4)}
              </div>
              <div
                className={`justify-start ${totalProfit === 0 ? 'text-white' : totalProfit > 0 ? 'text-[#21ef8b]' : 'text-[#ff5c5c]'} text-[32px] font-semibold`}
              >
                <span className="text-[50px] font-semibold mr-2">
                  {totalProfit === 0 ? ' ' : totalProfit > 0 ? '+' : '-'}$
                  {formatWithCommas(Math.abs(totalProfit).toFixed(4))}
                </span>
                <span className="text-[28px] font-semibold">USDC</span>
              </div>
            </div>

            <div className="w-fit gap-[14px] p-[20px] flex flex-wrap justify-start flex-col h-[140px] bg-gradient-to-r from-[#000000]/40 to-[#000000]/40 rounded-2xl overflow-auto">
              {trades
                .sort((a, b) =>
                  a.currency.symbol.localeCompare(b.currency.symbol),
                )
                .map(({ currency, pnl }, index) => (
                  <div
                    key={index}
                    className="self-stretch flex justify-start items-center gap-3 w-[200px] h-6"
                  >
                    <CurrencyIcon
                      chain={chain}
                      currency={currency}
                      className="w-6 h-6"
                    />
                    <div
                      className={`justify-start ${pnl === 0 ? 'text-white' : pnl > 0 ? 'text-[#21ef8b]' : 'text-[#ff5c5c]'} text-lg font-semibold`}
                    >
                      {pnl === 0 ? ' ' : pnl > 0 ? '+' : '-'}$
                      {formatWithCommas(Math.abs(pnl).toFixed(4))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="self-stretch w-full h-12 px-5 py-1.5 rounded-xl inline-flex justify-center items-center gap-10">
          <button
            onClick={async () =>
              handleTextShare(userAddress, totalProfit, 'telegram')
            }
            className="flex flex-1 h-10 flex-row gap-1 bg-blue-500/20 rounded-xl text-blue-400 text-base font-bold leading-normal justify-center items-center"
          >
            <svg
              viewBox="0 0 1000 1000"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
            >
              <defs>
                <linearGradient
                  x1="50%"
                  y1="0%"
                  x2="50%"
                  y2="99.2583404%"
                  id="linearGradient-1"
                >
                  <stop stopColor="#2AABEE" offset="0%"></stop>
                  <stop stopColor="#60A5FA" offset="100%"></stop>
                </linearGradient>
              </defs>
              <g
                id="Artboard"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <circle
                  id="Oval"
                  fill="url(#linearGradient-1)"
                  cx="500"
                  cy="500"
                  r="500"
                ></circle>
                <path
                  d="M226.328419,494.722069 C372.088573,431.216685 469.284839,389.350049 517.917216,369.122161 C656.772535,311.36743 685.625481,301.334815 704.431427,301.003532 C708.567621,300.93067 717.815839,301.955743 723.806446,306.816707 C728.864797,310.92121 730.256552,316.46581 730.922551,320.357329 C731.588551,324.248848 732.417879,333.113828 731.758626,340.040666 C724.234007,419.102486 691.675104,610.964674 675.110982,699.515267 C668.10208,736.984342 654.301336,749.547532 640.940618,750.777006 C611.904684,753.448938 589.856115,731.588035 561.733393,713.153237 C517.726886,684.306416 492.866009,666.349181 450.150074,638.200013 C400.78442,605.66878 432.786119,587.789048 460.919462,558.568563 C468.282091,550.921423 596.21508,434.556479 598.691227,424.000355 C599.00091,422.680135 599.288312,417.758981 596.36474,415.160431 C593.441168,412.561881 589.126229,413.450484 586.012448,414.157198 C581.598758,415.158943 511.297793,461.625274 375.109553,553.556189 C355.154858,567.258623 337.080515,573.934908 320.886524,573.585046 C303.033948,573.199351 268.692754,563.490928 243.163606,555.192408 C211.851067,545.013936 186.964484,539.632504 189.131547,522.346309 C190.260287,513.342589 202.659244,504.134509 226.328419,494.722069 Z"
                  id="Path-3"
                  fill="#FFFFFF"
                ></path>
              </g>
            </svg>
            Telegram
          </button>

          <button
            onClick={async () =>
              handleTextShare(userAddress, totalProfit, 'twitter')
            }
            className="flex flex-1 h-10 flex-row gap-1 bg-blue-500/20 rounded-xl text-blue-400 text-base font-bold leading-normal justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1200"
              height="1227"
              viewBox="0 0 1200 1227"
              fill="none"
              className="w-4 h-4"
            >
              <path
                d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
                fill="#60A5FA"
              />
            </svg>
            Twitter
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-1 h-10 flex-row gap-1 bg-blue-500/20 rounded-xl text-blue-400 text-base font-bold leading-normal justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
            >
              <path
                d="M4.5 17V19C4.5 19.5304 4.71071 20.0391 5.08579 20.4142C5.46086 20.7893 5.96957 21 6.5 21H18.5C19.0304 21 19.5391 20.7893 19.9142 20.4142C20.2893 20.0391 20.5 19.5304 20.5 19V17M7.5 11L12.5 16M12.5 16L17.5 11M12.5 16V4"
                stroke="#60A5FA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download
          </button>
        </div>
      </div>
    </Modal>
  )
}
