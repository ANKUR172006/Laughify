import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Loader2, MessageSquareHeart, Star, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthContext } from "../../auth/authContext";
import FeedbackModal from "../../shared/components/FeedbackModal";
import {
  getFeedbackStats,
  getPublicFeedback,
  toggleLikeFeedback
} from "../../shared/service/feedback.api";
import "../styles/LoveWallPage.scss";

const MotionArticle = motion.article;

const formatRelativeDate = (iso) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return "Recently";
  }
};

const normalizeReviews = (items) => {
  if (!Array.isArray(items)) return { reviews: [], likedSet: new Set() };

  const likedSet = new Set();
  const reviews = items.map((item) => {
    const id = item._id || item.id;
    if (item?.liked) likedSet.add(id);
    return {
      id,
      name: item.name || "Anonymous Friend",
      rating: Number(item.rating) || 0,
      avatar: item.avatar || "!",
      text: item.text || "",
      date: item.createdAt ? formatRelativeDate(item.createdAt) : (item.date || "Recently"),
      verified: !!item.isVerifiedUser,
      likes: typeof item.likes === "number" ? item.likes : 0
    };
  });

  return { reviews, likedSet };
};

export default function LoveWallPage() {
  const { user } = useAuthContext();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackOpenCount, setFeedbackOpenCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [reviewStats, setReviewStats] = useState({
    totalFeedbackCount: 0,
    publicReviewCount: 0,
    avgRating: 0,
    totalLikes: 0
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const loadLoveWall = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const [feedbackRes, statsRes] = await Promise.all([
        getPublicFeedback().catch(() => ({ success: false, feedback: [] })),
        getFeedbackStats().catch(() => ({
          success: false,
          stats: { totalFeedbackCount: 0, publicReviewCount: 0, avgRating: 0, totalLikes: 0 }
        }))
      ]);

      if (feedbackRes?.success && Array.isArray(feedbackRes.feedback)) {
        const { reviews: normalized, likedSet } = normalizeReviews(feedbackRes.feedback);
        setReviews(normalized);
        setLikedIds(likedSet);
      } else {
        setReviews([]);
        setLikedIds(new Set());
      }

      if (statsRes?.success && statsRes.stats) {
        setReviewStats({
          totalFeedbackCount: Number(statsRes.stats.totalFeedbackCount) || 0,
          publicReviewCount: Number(statsRes.stats.publicReviewCount) || 0,
          avgRating: Number(statsRes.stats.avgRating) || 0,
          totalLikes: Number(statsRes.stats.totalLikes) || 0
        });
      }
    } catch {
      setReviewsError("Could not load reviews right now.");
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadLoveWall, 0);
    return () => window.clearTimeout(timer);
  }, [loadLoveWall]);

  const openFeedback = useCallback(() => {
    setFeedbackOpenCount((n) => n + 1);
    setFeedbackOpen(true);
  }, []);

  const toggleLike = async (id) => {
    const wasLiked = likedIds.has(id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setReviews((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, likes: Math.max(0, item.likes + (wasLiked ? -1 : 1)) }
          : item
      )
    );

    try {
      const res = await toggleLikeFeedback(id);
      if (res?.success) {
        setReviews((items) =>
          items.map((item) =>
            item.id === id
              ? { ...item, likes: typeof res.likes === "number" ? res.likes : item.likes }
              : item
          )
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (res.liked) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      setReviews((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, likes: Math.max(0, item.likes + (wasLiked ? 1 : -1)) }
            : item
        )
      );
    }
  };

  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : reviewStats.avgRating;

  const reviewRotations = useMemo(() => {
    const map = new Map();
    reviews.forEach((review, index) => {
      const seed = String(review.id || index).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      map.set(review.id, ((seed % 7) - 3) * 0.45);
    });
    return map;
  }, [reviews]);

  const publicReviews = reviewStats.publicReviewCount || reviews.length;
  const totalLikes = reviewStats.totalLikes || reviews.reduce((sum, item) => sum + item.likes, 0);

  return (
    <div className="love-wall-page">
      <div className="love-wall-shell">
        <div className="love-wall-topbar">
          <Link to="/" className="love-wall-back">
            <ArrowLeft size={20} />
            Home
          </Link>
          <button className="love-wall-write-btn" onClick={openFeedback}>
            <MessageSquareHeart size={20} />
            Write Review
          </button>
        </div>

        <section className="love-wall-hero">
          <span className="section-kicker">Player Reviews</span>
          <h1>Love Wall</h1>
          <p>Real notes from players trying not to laugh.</p>
        </section>

        <div className="love-wall-stats">
          <div className="love-stat">
            <span>{avgRating > 0 ? avgRating.toFixed(1) : "--"}</span>
            <small>Avg Rating</small>
          </div>
          <div className="love-stat">
            <span>{publicReviews || "--"}</span>
            <small>Public Reviews</small>
          </div>
          <div className="love-stat">
            <span>{totalLikes || "--"}</span>
            <small>High Fives</small>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="love-wall-state">
            <Loader2 className="love-wall-loader" size={34} />
            <p>Loading the Love Wall...</p>
          </div>
        ) : reviewsError ? (
          <div className="love-wall-state">
            <p>{reviewsError}</p>
            <button onClick={loadLoveWall}>Try Again</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="love-wall-state">
            <h3>No reviews yet.</h3>
            <p>Be the first player on the wall.</p>
            <button onClick={openFeedback}>Write the First Review</button>
          </div>
        ) : (
          <div className="love-wall-grid">
            {reviews.map((review, index) => (
              <MotionArticle
                key={review.id}
                className={`love-review-card ${review.verified ? "verified" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.04 }}
                style={{ rotate: reviewRotations.get(review.id) ?? 0 }}
              >
                <div className="love-review-top">
                  <div className="love-avatar">{review.avatar}</div>
                  <div>
                    <div className="love-name-row">
                      <strong>{review.name}</strong>
                      {review.verified && (
                        <span>
                          <Award size={12} />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="love-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={15}
                          fill={n <= review.rating ? "#fbbf24" : "none"}
                        />
                      ))}
                      <small>{review.date}</small>
                    </div>
                  </div>
                </div>
                <p>{review.text}</p>
                <button
                  className={`love-like ${likedIds.has(review.id) ? "liked" : ""}`}
                  onClick={() => toggleLike(review.id)}
                >
                  <ThumbsUp size={16} />
                  {review.likes}
                </button>
              </MotionArticle>
            ))}
          </div>
        )}
      </div>

      <FeedbackModal
        key={feedbackOpenCount}
        isOpen={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          loadLoveWall();
        }}
        user={user}
      />
    </div>
  );
}
