import React from 'react'
import { NextRouter } from 'next/router'

import { PAGE_BUTTONS } from '../chain-configs/page-button'

import { PageButton } from './button/page-button'

const Sidebar = ({
  router,
}: {
  router: NextRouter
} & React.PropsWithChildren) => {
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
      </div>
    </div>
  )
}

export default Sidebar
