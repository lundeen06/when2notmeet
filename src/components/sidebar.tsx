'use client'

import { useState } from 'react'
import { Github, Heart, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
  
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
      href: "/donate/",
      isTitle: false
    }
  ]

  return (
    <div 
      className={`bg-white border-r border-gray-200 h-screen flex flex-col relative ${
        isDragging ? '' : 'transition-all duration-300'
      }`}
      style={{ width }}
    >
      {/* Resize handle */}
      <div 
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-gray-100 transition-colors z-10 flex items-center justify-center group"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
          const startX = e.clientX
          const startWidth = width
          
          const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault()
            const newWidth = Math.max(80, Math.min(400, startWidth + (e.clientX - startX)))
            setWidth(newWidth)
            setIsCollapsed(newWidth < 210)
          }
          
          const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault()
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'default'
            document.body.style.userSelect = 'auto'
          }
          
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
      </div>
      
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
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
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