import { ReactNode } from 'react'
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="w-full flex flex-col gap-8 items-center flex-1">{children}</main>
      <footer className="w-full flex gap-6 flex-wrap items-center justify-center pb-8 sm:pb-20">
        <div className="flex flex-col gap-8 items-center">Footer</div>
      </footer>
    </div>
  )
}

export default Layout
