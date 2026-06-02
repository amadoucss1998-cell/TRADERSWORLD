import { TradesProvider } from '@/context/TradesContext'
import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TradesProvider>
      <div className="flex min-h-screen bg-[#0d0d0d]">
        <Sidebar />
        <div className="flex-1 ml-60 min-w-0">
          {children}
        </div>
      </div>
    </TradesProvider>
  )
}
