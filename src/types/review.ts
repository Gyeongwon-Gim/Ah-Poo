export interface UserReview {
  id: string;
  pool_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: ReviewUser;
  images?: ReviewImage[];
}

export interface ReviewUser {
  id: string;
  nickname: string;
}

export interface ReviewImage {
  id: string;
  review_id: string;
  image_path: string;
  display_order: number;
  created_at: string;
}

export interface CreateReviewParams {
  poolId: string;
  rating: number;
  content: string;
  images?: File[];
}

export interface UpdateReviewParams {
  reviewId: string;
  rating?: number;
  content?: string;
  imagesToAdd?: File[];
  imageIdsToRemove?: string[];
}

export interface ReviewsResponse {
  reviews: UserReview[];
  totalCount: number;
  hasMore: boolean;
}
