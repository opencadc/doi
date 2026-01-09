import { ReactNode } from 'react'

export type Lang = 'en' | 'fr'

export type Params = Promise<{ locale: string }>

export interface RootLayoutProps {
  children: ReactNode
}

export interface LayoutProps {
  children: ReactNode
  params: Params
}
