export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4">
      <div className="container mx-auto text-center">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} Lundeen Cahilly
        </p>
      </div>
    </footer>
  )
}