import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { bidService, Bid } from '../services/bid.service'
import { bookingService } from '../services/booking.service'
import { toast } from 'react-toastify'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function CompleteBidBooking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  
  const [bid, setBid] = useState<Bid | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  
  const bidId = searchParams.get('bidId')
  const itemType = searchParams.get('itemType')
  const itemId = searchParams.get('itemId')
  const bidPrice = parseFloat(searchParams.get('price') || '0')
  const originalPrice = parseFloat(searchParams.get('originalPrice') || '0')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (!bidId || !user) {
      setError('Invalid bid information')
      setIsLoading(false)
      return
    }

    // Validate the bid
    validateBid()
  }, [bidId, user, isAuthenticated])

  const validateBid = async () => {
    if (!bidId || !user) return
    
    try {
      setIsLoading(true)
      const result = await bidService.validateBidForCompletion(parseInt(bidId), user.userId)
      
      if (result.valid && result.bid) {
        setBid(result.bid)
      } else {
        setError(result.error || 'This offer is no longer valid')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to validate offer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bid || !user) return
    
    // Basic validation
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast.error('Please fill in all payment details')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create booking with bid price
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      // Calculate quantity from room selections or default to 1
      const quantity = bid.roomSelections && bid.roomSelections.length > 0
        ? bid.roomSelections.reduce((sum, r) => sum + r.quantity, 0)
        : 1

      const bookingResult = await bookingService.create({
        bookingType: bid.itemType,
        entityId: bid.itemId,
        quantity,
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: nextWeek.toISOString().split('T')[0],
        totalAmount: bid.bidAmount,  // USE BID PRICE!
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolderName: cardName,
          expiryDate,
          cvv
        },
        bidId: bid.bidId,
        originalPrice: bid.originalPrice,
        // Include room selections for multi-room hotel bids
        roomSelections: bid.roomSelections
      })

      // Mark bid as completed
      await bidService.completeBid(bid.bidId, bookingResult.booking.bookingId)

      toast.success(`🎉 Booking confirmed! You saved $${(bid.originalPrice - bid.bidAmount).toFixed(2)}!`)
      
      // Navigate to booking confirmation
      navigate(`/my-bookings`)
    } catch (err: any) {
      console.error('Booking error:', err)
      toast.error(err.response?.data?.error || 'Failed to complete booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Validating your offer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Unable to Complete Booking
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/my-bookings')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Bookings
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!bid) return null

  const savings = bid.originalPrice - bid.bidAmount
  const discountPercent = ((savings / bid.originalPrice) * 100).toFixed(1)

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Your Offer Was Accepted! 🎉
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your booking now to lock in this special price
          </p>
        </div>

        {/* Pricing Summary */}
        <Card className="p-6 mb-6 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {bid.itemType.charAt(0).toUpperCase() + bid.itemType.slice(1)}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {bid.itemName || `${bid.itemType} #${bid.itemId}`}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 line-through">${bid.originalPrice.toFixed(2)}</p>
              <p className="text-3xl font-bold text-green-600">${bid.bidAmount.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Room breakdown for hotel bids */}
          {bid.itemType === 'hotel' && bid.roomSelections && bid.roomSelections.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Room Selection:</p>
              <div className="space-y-1">
                {bid.roomSelections.map((room, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                    <span className="capitalize">{room.quantity}× {room.roomType} room</span>
                    <span>${(room.pricePerNight * room.quantity).toFixed(2)}/night</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center justify-between">
            <span className="font-medium text-green-700 dark:text-green-300">
              💰 Your Savings
            </span>
            <span className="text-2xl font-bold text-green-600">
              ${savings.toFixed(2)} ({discountPercent}% off)
            </span>
          </div>
        </Card>

        {/* Payment Form */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
            
            <Input
              label="Cardholder Name"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
              <Input
                label="CVV"
                placeholder="123"
                type="password"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${bid.bidAmount.toFixed(2)}
                </span>
              </div>
              
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Booking - ${bid.bidAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
            🔒 Your payment information is secure and encrypted
          </p>
        </Card>
      </div>
    </div>
  )
}

