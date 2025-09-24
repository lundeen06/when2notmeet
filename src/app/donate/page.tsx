'use client'

import { useEffect } from 'react'

export default function DonatePage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.rawgit.com/eth-button/eth-button/09673e85d517452e18a5248b96115bc552a0ac01/dist/eth-button.js'
    script.setAttribute('data-address', '0x105C9B4677ABa7a8c56C3E3462457e493Fc3825C')
    script.setAttribute('data-meta', 'eth-button')
    
    const buttonContainer = document.getElementById('eth-button-container')
    if (buttonContainer) {
      buttonContainer.appendChild(script)
    }
    
    return () => {
      if (buttonContainer && script.parentNode) {
        buttonContainer.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Support when2notmeet</h1>
          <p className="text-sm text-muted-foreground">
            If you consider this website useful, I would like your money. <br></br> Please.
          </p>
        </div>
        
        <div className="CustomEtherButton">
          <div id="eth-button-container"></div>
        </div>
      </div>
    </div>
  )
}