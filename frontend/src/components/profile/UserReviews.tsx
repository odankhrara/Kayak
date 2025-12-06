import { useState, useEffect } from 'react'
import { Star, MessageSquare, Plane, Hotel, Car, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'
import { reviewService, Review } from '../../services/review.service'
import { useAuthStore } from '../../store/authStore'
import Card from '../common/Card'

const TYPE_ICONS = {
  flight: Plane,
  hotel: Hotel,
  car: Car
}

const TYPE_COLORS = {
  flight: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  hotel: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  car: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30'
}

export default function UserReviews() {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (user) loadReviews()
  }, [user])

  const loadReviews = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await reviewService.getReviewsByUser(user.userId)
      setReviews(data)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this review?')) return

    setDeletingId(reviewId)
    try {
      await reviewService.deleteReview(reviewId, user.userId)
      toast.success('Review deleted')
      loadReviews()
    } catch (error) {
      toast.error('Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
    )
  }

  // Group reviews by type
  const groupedReviews = reviews.reduce((acc, review) => {
    if (!acc[review.itemType]) acc[review.itemType] = []
    acc[review.itemType].push(review)
    return acc
  }, {} as Record<string, Review[]>)

  // Calculate stats
  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    byType: {
      flight: groupedReviews.flight?.length || 0,
      hotel: groupedReviews.hotel?.length || 0,
      car: groupedReviews.car?.length || 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          No reviews yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Book a trip and share your experience!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Reviews</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-1">
            {stats.avgRating}
            <Star className="w-6 h-6 fill-yellow-400" />
          </div>
          <div className="text-sm text-slate-500">Avg Rating</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <span className="text-blue-500">{stats.byType.flight}</span>
            <span className="text-purple-500">{stats.byType.hotel}</span>
            <span className="text-teal-500">{stats.byType.car}</span>
          </div>
          <div className="text-sm text-slate-500">By Type</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">
            {reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0)}
          </div>
          <div className="text-sm text-slate-500">Helpful Votes</div>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const Icon = TYPE_ICONS[review.itemType]
          const colorClass = TYPE_COLORS[review.itemType]

          return (
            <Card key={review.reviewId} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        {review.itemType}
                      </span>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {review.title && (
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {review.title}
                    </h4>
                  )}
                  {review.comment && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {review.comment}
                    </p>
                  )}

                  {/* Footer */}
                  {review.helpfulCount > 0 && (
                    <div className="mt-3 text-xs text-slate-500">
                      👍 {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteReview(review.reviewId)}
                  disabled={deletingId === review.reviewId}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete review"
                >
                  {deletingId === review.reviewId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

