import type { HomeReview } from '../../services/homeService'
import ReviewDisplayCard from './ReviewDisplayCard'

export default function HomeReviewCard({ review }: { review: HomeReview }) {
  return <ReviewDisplayCard review={review} />
}
