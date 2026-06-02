'use client'

import { useTrades } from '@/context/TradesContext'
import Header from '@/components/layout/Header'
import AnalyticsTabs from '@/components/analytics/AnalyticsTabs'

export default function AnalyticsPage() {
  const { trades, loading } = useTrades()

  return (
    <div>
      <Header title="Analytics" breadcrumb="Trading" />
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-[#71717a]">Loading...</div>
        ) : (
          <AnalyticsTabs trades={trades} />
        )}
      </div>
    </div>
  )
}
