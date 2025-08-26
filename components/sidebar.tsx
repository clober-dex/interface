import React from 'react'
import { NextRouter } from 'next/router'

const Sidebar = ({
  router,
}: {
  router: NextRouter
} & React.PropsWithChildren) => {
  return (
    <div className="invisible md:visible absolute top-0 left-0 h-full w-20 bg-[#151517] border-r border-[#2d2d2e] border-solid">
      Test
    </div>
  )
}

export default Sidebar
