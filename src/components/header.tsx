import { Github, Heart } from "lucide-react"

export function Header() {
  return (
    <header className="bg-white text-black py-4 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <a href="/" className="text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity">
          when2notmeet
        </a>
        
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/lundeen06/when2notmeet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            <Github className="h-6 w-6" />
            <span className="sr-only">GitHub</span>
          </a>
          
          <a
            href="#"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            <Heart className="h-6 w-6" />
            <span className="sr-only">Donate</span>
          </a>
        </div>
      </div>
    </header>
  )
}