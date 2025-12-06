import { CheckCircle, XCircle, Clock, AlertTriangle, ShoppingCart, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bid } from '../../services/bid.service'
import { formatDistanceToNow } from 'date-fns'

interface BidStatusProps {
  bid: Bid
  showDetails?: boolean
  onCompleteBooking?: (bid: Bid) => void
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

export default function BidStatus({ bid, showDetails = true, onCompleteBooking }: BidStatusProps) {
  const navigate = useNavigate()
  const config = statusConfig[bid.status]
  const Icon = config.icon
  const discountPercent = ((bid.originalPrice - bid.bidAmount) / bid.originalPrice * 100).toFixed(1)
  
  // Check if bid is still valid for completion (not expired)
  const isCompletable = bid.status === 'accepted' && 
                        new Date(bid.expiresAt) > new Date() && 
                        !bid.bookingId

  const handleCompleteBooking = () => {
    if (onCompleteBooking) {
      onCompleteBooking(bid)
    } else {
      // Navigate to booking page with bid info
      const params = new URLSearchParams({
        bidId: bid.bidId.toString(),
        itemType: bid.itemType,
        itemId: bid.itemId,
        price: bid.bidAmount.toString(),
        originalPrice: bid.originalPrice.toString()
      })
      navigate(`/booking/complete-bid?${params.toString()}`)
    }
  }

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
          {/* Room breakdown for hotel bids */}
          {bid.itemType === 'hotel' && bid.roomSelections && bid.roomSelections.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-200 dark:border-slate-600">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Room Selection:</span>
              <div className="flex flex-wrap gap-1">
                {bid.roomSelections.map((room, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                  >
                    {room.quantity}× {room.roomType}
                  </span>
                ))}
              </div>
            </div>
          )}
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

      {isCompletable && (
        <div className="mt-3 space-y-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md text-center">
            <span className="text-sm text-green-700 dark:text-green-300">
              🎉 Offer accepted! Complete booking within{' '}
              {formatDistanceToNow(new Date(bid.expiresAt))}
            </span>
          </div>
          <button
            onClick={handleCompleteBooking}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 
                       bg-gradient-to-r from-green-500 to-emerald-600 
                       hover:from-green-600 hover:to-emerald-700
                       text-white font-semibold rounded-lg shadow-md 
                       transform transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingCart className="w-5 h-5" />
            Complete Booking at ${bid.bidAmount.toFixed(2)}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {bid.status === 'accepted' && !isCompletable && bid.bookingId && (
        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-center">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            ✅ Booking completed! (ID: {bid.bookingId})
          </span>
        </div>
      )}

      {bid.status === 'accepted' && !isCompletable && !bid.bookingId && (
        <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md text-center">
          <span className="text-sm text-orange-700 dark:text-orange-300">
            ⏰ This offer has expired
          </span>
        </div>
      )}
    </div>
  )
}

