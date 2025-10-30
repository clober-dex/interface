import React from 'react'
import { createPortal } from 'react-dom'

const Modal = ({
  show,
  onClose,
  children,
  onModalClick,
  width = '480px',
}: {
  show: boolean
  onClose: () => void
  onModalClick?: () => void
  width?: string
} & React.PropsWithChildren) => {
  if (!show) {
    return <></>
  }

  return createPortal(
    <div
      className="flex items-center justify-center fixed inset-0 bg-black bg-opacity-50 z-[1000] backdrop-blur-sm px-4 sm:px-0"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:w-auto bg-[#17181e] text-white rounded-xl sm:rounded-2xl p-4 sm:p-6"
        style={{ width }}
        onClick={(e) => {
          onModalClick?.()
          e.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
