import { useState } from 'react'
import { toast } from 'react-toastify'
import { Send } from 'lucide-react'
import StarRating from './StarRating'
import Button from '../common/Button'
import { reviewService, CreateReviewInput } from '../../services/review.service'
import { useAuthStore } from '../../store/authStore'

interface ReviewFormProps {
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  bookingId?: number
  onSuccess?: () => void
}

export default function ReviewForm({ itemType, itemId, bookingId, onSuccess }: ReviewFormProps) {
  const { user } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const input: CreateReviewInput = {
        userId: user.userId,
        itemType,
        itemId,
        bookingId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined
      }

      await reviewService.createReview(input)
      toast.success('Review submitted successfully!')
      
      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
      
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Write a Review</h3>
      
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Your Rating *
        </label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={200}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Your Review (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience..."
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}

