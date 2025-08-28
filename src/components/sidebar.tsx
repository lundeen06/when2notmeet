'use client'

import { useState } from 'react'
import { Github, Heart, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const sidebarItems = [
    {
      icon: Calendar,
      label: "when2notmeet",
      href: "/",
      isTitle: true
    },
    {
      icon: Plus,
      label: "Create New Event", 
      href: "/",
      isTitle: false
    },
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/lundeen06/when2notmeet",
      isTitle: false,
      external: true
    },
    {
      icon: Heart,
      label: "Donate <3",
      href: "/donate/eth",
      // <script
      //   src="https://cdn.rawgit.com/eth-button/eth-button/09673e85d517452e18a5248b96115bc552a0ac01/dist/eth-button.js"
      //   data-address="0xd2f4668D0e752e95a8CE01014233458471DDbA4B"
      //   data-meta="eth-button">
      // </script>
      isTitle: false
    }
  ]

  return (
    <div 
      className={`bg-white border-r border-gray-200 h-screen transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Resize handle */}
      <div 
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={(e) => {
          const startX = e.clientX
          const startWidth = isCollapsed ? 64 : 256
          
          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + (e.clientX - startX)
            setIsCollapsed(newWidth < 150)
          }
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }
          
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      />
      
      {/* Sidebar content */}
      <div className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon
          
          if (item.external) {
            return (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                } ${item.isTitle ? 'font-bold text-lg' : 'text-sm'}`}
              >
                <Icon className={`${item.isTitle ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                {!isCollapsed && <span>{item.label}</span>}
              </a>
            )
          }
          
          return (
            <a
              key={index}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              } ${item.isTitle ? 'font-bold text-lg' : 'text-sm'}`}
            >
              <Icon className={`${item.isTitle ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
              {!isCollapsed && <span>{item.label}</span>}
            </a>
          )
        })}
      </div>
    </div>
  )
}