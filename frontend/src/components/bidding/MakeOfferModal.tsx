import { useState, useEffect, useRef } from 'react'
import { X, DollarSign, TrendingDown, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../common/Button'
import { bidService } from '../../services/bid.service'
import { useAuthStore } from '../../store/authStore'
import { trackClick } from '../../utils/clickTracking'
import { formatCurrency } from '../../utils/formatters'

export interface RoomSelectionForBid {
  roomType: string
  quantity: number
  pricePerNight: number
  maxGuests: number
}

interface MakeOfferModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  itemName: string
  originalPrice: number
  onSuccess?: (bid: any) => void
  initialBidAmount?: number // For automation/deep-linking
  roomSelections?: RoomSelectionForBid[] // For multi-room hotel bids
  nights?: number // For hotel bookings
}

export default function MakeOfferModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  originalPrice,
  onSuccess,
  initialBidAmount,
  roomSelections,
  nights
}: MakeOfferModalProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [bidAmount, setBidAmount] = useState(initialBidAmount?.toString() || '')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes or initialBidAmount changes
  useEffect(() => {
    if (isOpen) {
      setBidAmount(initialBidAmount?.toString() || '')
      setNotes('')
    }
  }, [isOpen, initialBidAmount])

  // Listen for custom events (for browser automation)
  useEffect(() => {
    const handleSetBidAmount = (e: CustomEvent) => {
      if (e.detail?.amount) {
        setBidAmount(e.detail.amount.toString())
      }
    }
    
    window.addEventListener('setBidAmount' as any, handleSetBidAmount)
    return () => window.removeEventListener('setBidAmount' as any, handleSetBidAmount)
  }, [])

  if (!isOpen) return null

  const bidValue = parseFloat(bidAmount) || 0
  const discountPercent = bidValue > 0 ? ((originalPrice - bidValue) / originalPrice * 100) : 0
  const isValidBid = bidValue > 0 && bidValue <= originalPrice

  // Acceptance likelihood indicator
  const getLikelihood = () => {
    if (bidValue === 0) return { text: 'Enter an amount', color: 'text-slate-400' }
    const percent = (bidValue / originalPrice) * 100
    if (percent >= 85) return { text: 'High chance of acceptance', color: 'text-green-500' }
    if (percent >= 70) return { text: 'Moderate chance', color: 'text-yellow-500' }
    return { text: 'Low chance - try a higher offer', color: 'text-red-500' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !user) {
      toast.error('Please login to make an offer')
      return
    }

    if (!isValidBid) {
      toast.error('Please enter a valid bid amount')
      return
    }

    setIsSubmitting(true)

    // Track the bid attempt
    trackClick({
      elementType: 'button',
      elementId: 'submit-bid',
      elementText: `Bid $${bidValue} for ${itemName}`,
      pageUrl: window.location.pathname,
      metadata: {
        itemType,
        itemId,
        originalPrice,
        bidAmount: bidValue,
        discountPercent: discountPercent.toFixed(2)
      }
    })

    try {
      const bid = await bidService.createBid({
        userId: user.userId,
        itemType,
        itemId,
        originalPrice,
        bidAmount: bidValue,
        notes: notes.trim() || undefined,
        roomSelections: roomSelections,
        nights: nights
      })

      if (bid.status === 'accepted') {
        toast.success(`🎉 Your offer of $${bidValue.toFixed(2)} was accepted! Complete your booking within 24 hours.`)
      } else if (bid.status === 'rejected') {
        toast.error(`Your offer was not accepted. Try a higher amount.`)
      } else {
        toast.info('Your offer has been submitted and is being reviewed.')
      }

      onSuccess?.(bid)
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const likelihood = getLikelihood()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl 
                      transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Make an Offer
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Item Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
            </div>
            <div className="font-medium text-slate-900 dark:text-white">{itemName}</div>
            
            {/* Room breakdown for hotel bids */}
            {itemType === 'hotel' && roomSelections && roomSelections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Room Selection:</div>
                <div className="space-y-1">
                  {roomSelections.map((room, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="capitalize">{room.quantity}× {room.roomType}</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {formatCurrency(room.pricePerNight * room.quantity * (nights || 1))}
                      </span>
                    </div>
                  ))}
                </div>
                {nights && (
                  <div className="text-xs text-slate-500 mt-1">
                    {nights} night{nights > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
              Listed Price: {formatCurrency(originalPrice)}
            </div>
          </div>

          {/* Bid Amount Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Offer *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="number"
                id="bid-amount-input"
                data-testid="bid-amount-input"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                onInput={(e) => setBidAmount((e.target as HTMLInputElement).value)}
                placeholder="0.00"
                step="0.01"
                min="1"
                max={originalPrice}
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-lg 
                           bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Discount Display */}
          {bidValue > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 
                            rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  {discountPercent.toFixed(1)}% off
                </span>
              </div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Save ${(originalPrice - bidValue).toFixed(2)}
              </span>
            </div>
          )}

          {/* Likelihood Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className={`w-4 h-4 ${likelihood.color}`} />
            <span className={likelihood.color}>{likelihood.text}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 
                          rounded-lg p-3">
            <p>• Offers expire in 24 hours if not accepted</p>
            <p>• Offers at 85%+ of listed price are usually accepted</p>
            <p>• If accepted, you must complete booking within 24 hours</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValidBid || isSubmitting}
            className="w-full"
            data-testid="submit-bid-button"
          >
            {isSubmitting ? 'Submitting...' : `Submit Offer ${bidValue > 0 ? `- $${bidValue.toFixed(2)}` : ''}`}
          </Button>
        </form>
      </div>
    </div>
  )
}

