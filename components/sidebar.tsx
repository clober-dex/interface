import React from 'react'
import { NextRouter } from 'next/router'

import { PAGE_BUTTONS } from '../chain-configs/page-button'
import useDropdown from '../hooks/useDropdown'

import { PageButton } from './button/page-button'
import { PageSelector } from './selector/page-selector'

const Sidebar = ({
  router,
}: {
  router: NextRouter
} & React.PropsWithChildren) => {
  const { showDropdown, setShowDropdown } = useDropdown()
  const isMoreSelected = PAGE_BUTTONS.filter((page) => page.isHiddenMenu).some(
    (page) => router.pathname.includes(page.path),
  )
  return (
    <div className="invisible md:visible fixed z-[1] flex top-0 left-0 h-screen items-center justify-center w-20 bg-[#151517] border-r border-[#2d2d2e] border-solid">
      <div className="flex flex-col justify-center items-center gap-3">
        {PAGE_BUTTONS.filter((page) => !page.isHiddenMenu).map((page) => (
          <div key={page.path}>
            <PageButton
              disabled={router.pathname.includes(page.path)}
              onClick={() => router.push(page.path)}
            >
              {page.icon}
            </PageButton>
          </div>
        ))}

        {PAGE_BUTTONS.filter((page) => page.isHiddenMenu).length > 0 && (
          <button
            disabled={false}
            onClick={() => {
              setShowDropdown((prev) => !prev)
            }}
            className="flex justify-center w-10 h-10"
          >
            <div className="flex w-full items-center justify-center gap-1">
              <div className="w-1 h-1 bg-[#8d94a1] rounded-full" />
              <div className="w-1 h-1 bg-[#8d94a1] rounded-full" />
              <div className="w-1 h-1 bg-[#8d94a1] rounded-full" />
            </div>

            <div className="relative">
              {showDropdown ? <PageSelector /> : <></>}
            </div>
          </button>
          // <button
          //   className="flex flex-row gap-2 items-center text-gray-500 font-semibold disabled:text-white stroke-gray-500 fill-gray-500 disabled:stroke-blue-500 disabled:fill-blue-500"
          //   disabled={false}
          //   onClick={() => {
          //     setShowDropdown((prev) => !prev)
          //   }}
          // >
          //   {/*<span className={isMoreSelected ? 'text-white' : ''}>More</span>*/}
          //   <svg
          //     xmlns="http://www.w3.org/2000/svg"
          //     width="10"
          //     height="6"
          //     viewBox="0 0 10 6"
          //     fill="none"
          //     className="rotate-180"
          //   >
          //     <path
          //       d="M9 5L5 1L1 5"
          //       stroke={isMoreSelected ? '#60A5FA' : '#9CA3AF'}
          //       strokeWidth="2"
          //       strokeLinecap="round"
          //       strokeLinejoin="round"
          //     />
          //   </svg>
          //   <div className="relative">
          //     {showDropdown ? <PageSelector /> : <></>}
          //   </div>
          // </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar
