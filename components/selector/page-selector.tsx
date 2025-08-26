import React from 'react'
import { useRouter } from 'next/router'

import { PAGE_BUTTONS } from '../../chain-configs/page-button'
import { PageButton } from '../button/page-button'

export const PageSelector = () => {
  const router = useRouter()

  return (
    <div className="absolute -left-8 top-4 md:top-10 z-[1500] flex flex-col bg-gray-800 border border-solid border-gray-700 rounded-xl p-1 items-start shadow-[4px_4px_12px_12px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col items-start self-stretch rounded-none">
        <div className="flex flex-col gap-2 items-start self-stretch rounded-none">
          {PAGE_BUTTONS.filter((button) => button.isHiddenMenu).map((page) => (
            <div key={page.path}>
              <PageButton
                className="!bg-transparent"
                disabled={router.pathname.includes(page.path)}
                onClick={() => router.push(page.path)}
              >
                <div className="w-4 h-4 flex justify-center items-center">
                  {page.icon}
                </div>
                {page.label}
              </PageButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
