'use client'

import { useState, useEffect } from 'react'
import { Github, Heart, Plus, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DuckIcon } from "@/components/duck-icon"

export function ResponsiveNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Determine screen size and responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth
      
      if (windowWidth < 768) { // Mobile phones
        setIsMobile(true)
        setIsMobileMenuOpen(false) // Ensure menu is closed on mobile
      } else if (windowWidth < 1024) { // Tablets
        setIsMobile(false)
        setIsCollapsed(true)
        setWidth(80) // Collapsed width
        setIsMobileMenuOpen(false) // Close mobile menu when switching to tablet
      } else { // Desktop
        setIsMobile(false)
        setIsMobileMenuOpen(false) // Close mobile menu when switching to desktop
        if (isCollapsed && width <= 80) {
          setIsCollapsed(false)
          setWidth(256) // Expanded width
        }
      }
    }
    
    // Set initial state
    handleResize()
    setMounted(true)
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCollapsed, width])
  
  const sidebarItems = [
    {
      icon: DuckIcon,
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

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  if (isMobile) {
    return (
      <div>
        {/* Mobile Header - Fixed and collapsed by default */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-12">
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2">
              <DuckIcon size={16} className="flex-shrink-0" />
              <span className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>when2notmeet</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 h-6 w-6"
            >
              {isMobileMenuOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
            </Button>
          </div>
        </div>


        {/* Mobile Menu - Dropdown style */}
        <div 
          className={`fixed top-12 left-0 right-0 bg-white border-b border-gray-200 z-50 transform transition-transform duration-300 overflow-hidden ${
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ 
            visibility: isMobileMenuOpen ? 'visible' : 'hidden',
            opacity: isMobileMenuOpen ? 1 : 0
          }}
        >
          <div className="p-3 space-y-2">
            {sidebarItems.slice(1).map((item, index) => {
              const Icon = item.icon
              
              if (item.external) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                    style={{ color: 'hsl(var(--foreground))' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </a>
                )
              }
              
              return (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  style={{ color: 'hsl(var(--foreground))' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

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
                style={{ color: item.isTitle ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
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
              style={{ color: item.isTitle ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
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