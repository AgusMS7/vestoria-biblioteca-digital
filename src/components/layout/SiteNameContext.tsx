'use client'

import { createContext, useContext, type ReactNode } from 'react'

const SiteNameContext = createContext<string | null>(null)

export function SiteNameProvider({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <SiteNameContext.Provider value={name}>{children}</SiteNameContext.Provider>
  )
}

export function useSiteName(): string {
  const name = useContext(SiteNameContext)

  if (name === null) {
    throw new Error('useSiteName must be used within a SiteNameProvider')
  }

  return name
}
