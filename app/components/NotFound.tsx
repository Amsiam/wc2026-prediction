import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-gray-400 text-sm">That URL does not match a page in this app.</p>
      <div className="flex gap-3 text-sm">
        <Link to="/predictor" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600">Predictor</Link>
        <Link to="/schedule" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600">Schedule</Link>
      </div>
    </div>
  )
}
