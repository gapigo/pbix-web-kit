import React from "react"
import type { Storyboard } from "../data/types"

interface PageTabsProps {
  storyboard: Storyboard
  activePage: string
  onPageChange: (name: string) => void
  mode?: "composer" | "generator"
}

export function PageTabs({ storyboard, activePage, onPageChange, mode = "composer" }: PageTabsProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto pb-2" role="tablist">
      {storyboard.pages.map((page) => (
        <button
          key={page.name}
          role="tab"
          aria-selected={activePage === page.name}
          onClick={() => onPageChange(page.name)}
          className={`
            px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors
            ${
              activePage === page.name
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }
          `}
        >
          {page.display_name}
        </button>
      ))}
    </nav>
  )
}
