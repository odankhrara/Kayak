import { CheckCircle, XCircle, Clock, AlertTriangle, ShoppingCart } from 'lucide-react'
import { Bid } from '../../services/bid.service'
import { formatDistanceToNow } from 'date-fns'

interface BidStatusProps {
  bid: Bid
  showDetails?: boolean
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'Pending'
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'Accepted!'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'Not Accepted'
  },
  expired: {
    icon: AlertTriangle,
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-700/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'Expired'
  },
  completed: {
    icon: ShoppingCart,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'Completed'
  }
}

export default function BidStatus({ bid, showDetails = true }: BidStatusProps) {
  const config = statusConfig[bid.status]
  const Icon = config.icon
  const discountPercent = ((bid.originalPrice - bid.bidAmount) / bid.originalPrice * 100).toFixed(1)

  return (
    <div className={`rounded-lg p-4 ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${config.color}`} />
        <div className="flex-1">
          <div className={`font-semibold ${config.color}`}>{config.text}</div>
          {bid.itemName && (
            <div className="text-sm text-slate-600 dark:text-slate-400">{bid.itemName}</div>
          )}
        </div>
        {showDetails && (
          <div className="text-right">
            <div className="font-bold text-slate-900 dark:text-white">
              ${bid.bidAmount.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {discountPercent}% off
            </div>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Original Price:</span>
            <span className="text-slate-700 dark:text-slate-300 line-through">
              ${bid.originalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Your Savings:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              ${(bid.originalPrice - bid.bidAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Submitted:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
            </span>
          </div>
          {bid.status === 'pending' && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Expires:</span>
              <span className="text-orange-600 dark:text-orange-400">
                {formatDistanceToNow(new Date(bid.expiresAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      )}

      {bid.status === 'accepted' && (
        <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-md text-center">
          <span className="text-sm text-green-700 dark:text-green-300">
            Complete your booking to secure this price!
          </span>
        </div>
      )}
    </div>
  )
}

