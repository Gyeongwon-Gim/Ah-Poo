import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  UserReview,
  ReviewImage,
  CreateReviewParams,
  UpdateReviewParams,
  ReviewsResponse,
} from '@/types/review';

const REVIEWS_PER_PAGE = 10;
const MAX_IMAGES_PER_REVIEW = 3;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ReviewRow {
  id: string;
  pool_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  review_images?: ReviewImageRow[];
}

interface ReviewImageRow {
  id: string;
  review_id: string;
  image_path: string;
  display_order: number;
  created_at: string;
}

const mapImageRowToReviewImage = (row: ReviewImageRow): ReviewImage => ({
  id: row.id,
  review_id: row.review_id,
  image_path: row.image_path,
  display_order: row.display_order,
  created_at: row.created_at,
});

const mapRowToUserReview = (row: ReviewRow): UserReview => ({
  id: row.id,
  pool_id: row.pool_id,
  user_id: row.user_id,
  rating: row.rating,
  content: row.content,
  created_at: row.created_at,
  updated_at: row.updated_at,
  images: row.review_images?.map(mapImageRowToReviewImage),
});

const assertSupabaseConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return supabase;
};

export const fetchPoolReviews = async (
  poolId: string,
  page = 0,
): Promise<ReviewsResponse> => {
  const client = assertSupabaseConfigured();
  const from = page * REVIEWS_PER_PAGE;
  const to = from + REVIEWS_PER_PAGE - 1;

  const { data, error, count } = await client
    .from('user_reviews')
    .select('*, review_images(*)', { count: 'exact' })
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const reviews = (data ?? []).map((row) => mapRowToUserReview(row as ReviewRow));
  const totalCount = count ?? 0;

  return {
    reviews,
    totalCount,
    hasMore: from + reviews.length < totalCount,
  };
};

export const fetchUserReviewForPool = async (
  poolId: string,
  userId: string,
): Promise<UserReview | null> => {
  const client = assertSupabaseConfigured();

  const { data, error } = await client
    .from('user_reviews')
    .select('*, review_images(*)')
    .eq('pool_id', poolId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data ? mapRowToUserReview(data as ReviewRow) : null;
};

const uploadReviewImage = async (
  userId: string,
  reviewId: string,
  file: File,
  order: number,
): Promise<string> => {
  const client = assertSupabaseConfigured();

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('이미지 크기는 5MB 이하여야 합니다.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${reviewId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from('review-images')
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { error: insertError } = await client.from('review_images').insert({
    review_id: reviewId,
    image_path: path,
    display_order: order,
  });

  if (insertError) throw insertError;

  return path;
};

export const createReview = async ({
  poolId,
  rating,
  content,
  images = [],
}: CreateReviewParams): Promise<UserReview> => {
  const client = assertSupabaseConfigured();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  if (images.length > MAX_IMAGES_PER_REVIEW) {
    throw new Error(`이미지는 최대 ${MAX_IMAGES_PER_REVIEW}장까지 첨부할 수 있습니다.`);
  }

  const { data: review, error: reviewError } = await client
    .from('user_reviews')
    .insert({
      pool_id: poolId,
      user_id: user.id,
      rating,
      content,
    })
    .select()
    .single();

  if (reviewError) throw reviewError;

  if (images.length > 0) {
    await Promise.all(
      images.map((file, index) =>
        uploadReviewImage(user.id, review.id, file, index),
      ),
    );
  }

  return fetchUserReviewForPool(poolId, user.id) as Promise<UserReview>;
};

export const updateReview = async ({
  reviewId,
  rating,
  content,
  imagesToAdd = [],
  imageIdsToRemove = [],
}: UpdateReviewParams): Promise<UserReview> => {
  const client = assertSupabaseConfigured();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) updates.rating = rating;
  if (content !== undefined) updates.content = content;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await client
      .from('user_reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
  }

  if (imageIdsToRemove.length > 0) {
    const { data: imagesToDelete } = await client
      .from('review_images')
      .select('image_path')
      .in('id', imageIdsToRemove);

    if (imagesToDelete?.length) {
      await client.storage
        .from('review-images')
        .remove(imagesToDelete.map((img) => img.image_path));
    }

    await client.from('review_images').delete().in('id', imageIdsToRemove);
  }

  if (imagesToAdd.length > 0) {
    const { data: existingImages } = await client
      .from('review_images')
      .select('display_order')
      .eq('review_id', reviewId)
      .order('display_order', { ascending: false })
      .limit(1);

    const startOrder = (existingImages?.[0]?.display_order ?? -1) + 1;

    await Promise.all(
      imagesToAdd.map((file, index) =>
        uploadReviewImage(user.id, reviewId, file, startOrder + index),
      ),
    );
  }

  const { data: updatedReview } = await client
    .from('user_reviews')
    .select('*, review_images(*)')
    .eq('id', reviewId)
    .single();

  return mapRowToUserReview(updatedReview as ReviewRow);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  const client = assertSupabaseConfigured();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: images } = await client
    .from('review_images')
    .select('image_path')
    .eq('review_id', reviewId);

  if (images?.length) {
    await client.storage
      .from('review-images')
      .remove(images.map((img) => img.image_path));
  }

  const { error } = await client
    .from('user_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getReviewImageUrl = (imagePath: string): string => {
  if (!supabase) return '';
  const { data } = supabase.storage.from('review-images').getPublicUrl(imagePath);
  return data.publicUrl;
};
