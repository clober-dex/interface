import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NextRouter } from 'next/router'

import { CHAIN_CONFIG } from '../chain-configs'
import { PAGE_BUTTONS } from '../chain-configs/page-button'

import { TwitterLogoSvg } from './svg/twitter-logo-svg'
import { DiscordLogoSvg } from './svg/discord-logo-svg'
import { DocsIconSvg } from './svg/docs-icon-svg'
import { PageButton } from './button/page-button'
import { GithubLogoSvg } from './svg/github-logo-svg'

const Panel = ({
  open,
  setOpen,
  router,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  router: NextRouter
} & React.PropsWithChildren) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={setOpen}>
        <div className="fixed inset-0 bg-transparent bg-opacity-5 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto max-w-md">
                  <div className="flex h-full flex-col bg-[#17181e] shadow-xl">
                    <div className="flex items-center px-4 h-12 justify-end pt-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-400 hover:text-gray-500 outline-none"
                        onClick={() => setOpen(false)}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex flex-col text-white text-base font-bold relative mb-6 flex-1 pl-6 pr-16 gap-8">
                      <div className="flex flex-col gap-4 items-start">
                        {PAGE_BUTTONS.map((button, index) => (
                          <div key={index}>
                            <PageButton
                              className="!bg-transparent"
                              disabled={router.pathname.includes(button.path)}
                              onClick={() => {
                                router.push(button.path)
                                setOpen(false)
                              }}
                            >
                              <div className="flex items-center w-4 h-4">
                                {button.icon}
                              </div>
                              {button.label}
                            </PageButton>
                          </div>
                        ))}
                      </div>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="192"
                        height="2"
                        viewBox="0 0 192 2"
                        fill="none"
                      >
                        <path
                          d="M0 1H192"
                          strokeWidth="1.5"
                          className="stroke-gray-600"
                        />
                      </svg>
                      <div className="flex flex-col gap-6">
                        {CHAIN_CONFIG.GITHIB_URL && (
                          <a
                            className="link"
                            target="_blank"
                            href={CHAIN_CONFIG.GITHIB_URL}
                            rel="noreferrer"
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <GithubLogoSvg className="w-4 h-4" />
                              Github
                            </div>
                          </a>
                        )}
                        {CHAIN_CONFIG.DOCS_URL && (
                          <a
                            className="link"
                            target="_blank"
                            href={CHAIN_CONFIG.DOCS_URL}
                            rel="noreferrer"
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <DocsIconSvg className="w-4 h-4" />
                              Docs
                            </div>
                          </a>
                        )}
                        {CHAIN_CONFIG.TWITTER_HANDLE && (
                          <a
                            className="link"
                            target="_blank"
                            href={`https://x.com/${CHAIN_CONFIG.TWITTER_HANDLE}`}
                            rel="noreferrer"
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <TwitterLogoSvg className="w-4 h-4" />
                              Twitter
                            </div>
                          </a>
                        )}
                        {CHAIN_CONFIG.DISCORD_URL && (
                          <a
                            className="link"
                            target="_blank"
                            href={CHAIN_CONFIG.DISCORD_URL}
                            rel="noreferrer"
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <DiscordLogoSvg className="w-4 h-4" />
                              Discord
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default Panel
