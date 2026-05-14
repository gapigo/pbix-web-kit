import React, { type ReactNode } from "react"

interface DashboardShellProps {
  title: string
  header?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardShell({ title, header, children, className = "" }: DashboardShellProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {header}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  )
}
