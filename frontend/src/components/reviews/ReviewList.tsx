import { useState, useEffect } from 'react'
import { ThumbsUp, User } from 'lucide-react'
import StarRating from './StarRating'
import { Review, ReviewStats, reviewService } from '../../services/review.service'
import { formatDistanceToNow } from 'date-fns'

interface ReviewListProps {
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  refreshTrigger?: number
}

export default function ReviewList({ itemType, itemId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [itemType, itemId, refreshTrigger])

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      const data = await reviewService.getReviewsForItem(itemType, itemId)
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHelpful = async (reviewId: number) => {
    try {
      await reviewService.markHelpful(reviewId)
      setReviews(reviews.map(r => 
        r.reviewId === reviewId 
          ? { ...r, helpfulCount: r.helpfulCount + 1 }
          : r
      ))
    } catch (error) {
      console.error('Failed to mark helpful:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && stats.reviewCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 
                        rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats.avgRating.toFixed(1)}
              </div>
              <StarRating rating={stats.avgRating} size="sm" />
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {stats.reviewCount} review{stats.reviewCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution[rating] || 0
                const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-slate-600 dark:text-slate-400">{rating}</span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-500 dark:text-slate-400">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          No reviews yet. Be the first to review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div 
              key={review.reviewId}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                                  flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {review.userName || 'Anonymous'}
                    </div>
                    {review.userCity && review.userState && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {review.userCity}, {review.userState}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} size="sm" />
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold text-slate-900 dark:text-white mt-3">
                  {review.title}
                </h4>
              )}

              {review.comment && (
                <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm leading-relaxed">
                  {review.comment}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handleHelpful(review.reviewId)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 
                             dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpfulCount})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

