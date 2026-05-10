import React from 'react'

const NavBar = () => {
  return (
    <nav className='h-13 border-b border-[#424242] sticky z-50 top-0'>
      <div className="w-5/6 h-full mx-auto flex items-center justify-between px-8">
        <div className="flex gap-3 justify-start">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="2" y="4" width="14" height="2" rx="1" fill="#7C6EF8"></rect>
            <rect x="2" y="9" width="10" height="2" rx="1" fill="#7C6EF8" opacity="0.7"></rect>
            <rect x="2" y="14" width="6" height="2" rx="1" fill="#7C6EF8" opacity="0.4"></rect>
            <circle cx="17" cy="5" r="1.4" fill="#1DD5A3"></circle></svg>
          <h1 className='text-[#edecf0] text-sm'>Memprobe</h1>
        </div>
        <div className="flex gap-2 items-center">
          <a className='text-[#9896A4] text-[13px] px-2.5 py-1.5'
            href=''>
            Docs
          </a>
          {/* <a className='text-[#9896A4] text-[13px] px-2.5 py-1.5'
            href=''>
            Changelog
          </a> */}
          <span className='bg-[#232329] w-px h-4.5'></span>
          <a className='text-[#9896A4] h-7.5 w-7.5 border border-[#232329] flex items-center justify-center rounded-md'
            href=''>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'
              stroke="currentColor" strokeWidth='1.5' strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}>
              <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
            </svg>
          </a>
          <a className='text-[#ffffff] bg-[#7C6EF8] rounded-md px-3 h-7.5 font-medium text-[13px] flex items-center hover:bg-[#9182FA] duration-120'
            href=''>
            Connect
          </a>
        </div>
      </div>
    </nav >
  )
}

export default NavBar