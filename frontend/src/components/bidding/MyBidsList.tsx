import { useState, useEffect } from 'react'
import { Gavel, RefreshCw } from 'lucide-react'
import BidStatus from './BidStatus'
import { Bid, bidService } from '../../services/bid.service'
import { useAuthStore } from '../../store/authStore'

export default function MyBidsList() {
  const { user } = useAuthStore()
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBids()
    }
  }, [user])

  const loadBids = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await bidService.getMyBids(user.userId)
      setBids(data)
    } catch (error) {
      console.error('Failed to load bids:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <Gavel className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
          No offers yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Make an offer on a flight, hotel, or car to see it here
        </p>
      </div>
    )
  }

  // Group bids by status
  const activeBids = bids.filter(b => b.status === 'pending' || b.status === 'accepted')
  const pastBids = bids.filter(b => b.status === 'rejected' || b.status === 'expired' || b.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Offers</h2>
        <button
          onClick={loadBids}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 
                     hover:text-blue-700 dark:hover:text-blue-300"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Active Bids */}
      {activeBids.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            Active ({activeBids.length})
          </h3>
          <div className="space-y-3">
            {activeBids.map(bid => (
              <BidStatus key={bid.bidId} bid={bid} showDetails />
            ))}
          </div>
        </div>
      )}

      {/* Past Bids */}
      {pastBids.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            History ({pastBids.length})
          </h3>
          <div className="space-y-3">
            {pastBids.map(bid => (
              <BidStatus key={bid.bidId} bid={bid} showDetails />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

