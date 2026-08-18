import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import gsap from "gsap";
import {
  X,
  Star,
  MessageSquareHeart,
  Send,
  Sparkles,
  Heart,
  Trophy,
  Camera,
  ThumbsUp,
  Users,
  Award,
  Loader2
} from "lucide-react";
import "../styles/FeedbackModal.scss";
import {
  submitFeedback,
  getPublicFeedback,
  getFeedbackStats,
  toggleLikeFeedback
} from "../service/feedback.api";

const GITHUB_REPO_URL = "https://github.com/ANKUR172006/Laughify";

const GithubIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c-1 3-4 5-6 5.5-.36.16-.64.45-.85.83-.2.39-.27.85-.19 1.3V22"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

const PartyPopperIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 8a4 4 0 0 0 0-8h-8 0l-3 3 0 2 2 2-5 5 2 2 2-2 5-5 2 2 2-2Z"></path>
    <path d="m12 12 10 10"></path>
    <path d="M17 22 22 17"></path>
    <path d="M12 15 15 12"></path>
    <path d="M18 15 22 11"></path>
    <path d="M11 15a6 6 0 0 0 0-6-6 6 0 0 0-6 6 6 6 0 0 0 6 6m0-6H4m4-3v6m-3-3h6"></path>
  </svg>
);

const funEmojis = ["😆", "🤣", "😹", "😭", "😂", "🥹", "🤩", "😎", "🎮", "🚀"];
const ratingLabels = [
  "Meh... 😐",
  "It's okay 🙂",
  "Pretty good 😊",
  "Awesome! 🤩",
  "LEGENDARY! 🔥"
];

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
    const wks = Math.floor(days / 7);
    if (wks < 5) return `${wks}w ago`;
    const mos = Math.floor(days / 30);
    return `${mos}mo ago`;
  } catch {
    return "Recently";
  }
};

const normalizeServerItems = (items) => {
  if (!Array.isArray(items)) return [];
  const likedSet = new Set();
  const normalized = items.map((f) => {
    if (f && f.liked) likedSet.add(f._id);
    return {
      id: f._id || f.id,
      name: f.name || "Anonymous Friend",
      rating: Number(f.rating) || 0,
      avatar: f.avatar || "😀",
      text: f.text || "",
      date: f.createdAt ? formatRelativeDate(f.createdAt) : (f.date || "Recently"),
      verified: !!f.isVerifiedUser,
      likes: typeof f.likes === "number" ? f.likes : 0
    };
  });
  return { normalized, likedSet };
};

const FeedbackModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState("rate");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.username || "",
    email: "",
    experience: "",
    allowSharing: true,
    isVerifiedUser: !!user
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [localTestimonials, setLocalTestimonials] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [stats, setStats] = useState({
    totalFeedbackCount: 0,
    publicReviewCount: 0,
    avgRating: 0,
    totalLikes: 0
  });
  const confettiContainerRef = useRef(null);
  const modalInnerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const loadFeedbackSummary = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError(null);

    try {
      const [fbRes, statsRes] = await Promise.all([
        getPublicFeedback().catch(() => ({ success: false, feedback: [] })),
        getFeedbackStats().catch(() => ({
          success: false,
          stats: { totalFeedbackCount: 0, publicReviewCount: 0, avgRating: 0, totalLikes: 0 }
        }))
      ]);

      if (fbRes && fbRes.success && Array.isArray(fbRes.feedback)) {
        const { normalized, likedSet } = normalizeServerItems(fbRes.feedback);
        setLocalTestimonials(normalized);
        setLikedIds(likedSet);
      } else {
        setLocalTestimonials([]);
        setLikedIds(new Set());
      }

      if (statsRes && statsRes.success && statsRes.stats) {
        setStats({
          totalFeedbackCount: Number(statsRes.stats.totalFeedbackCount) || 0,
          publicReviewCount: Number(statsRes.stats.publicReviewCount) || 0,
          avgRating: Number(statsRes.stats.avgRating) || 0,
          totalLikes: Number(statsRes.stats.totalLikes) || 0
        });
      }
    } catch {
      setLoadError("Couldn't load reviews right now.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(loadFeedbackSummary, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadFeedbackSummary]);

  useEffect(() => {
    if (isOpen) {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
      tl.fromTo(
        modalInnerRef.current?.querySelectorAll(".feedback-section"),
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.6 }
      );
    }
  }, [isOpen, activeTab, localTestimonials.length]);

  useEffect(() => {
    if (submitted && confettiContainerRef.current) {
      const container = confettiContainerRef.current;
      const timers = [];
      for (let i = 0; i < 25; i++) {
        const el = document.createElement("div");
        el.className = "confetti-piece";
        el.style.left = Math.random() * 100 + "%";
        el.style.top = "-20px";
        el.style.background = [
          "#fbbf24",
          "#f472b6",
          "#38bdf8",
          "#10b981",
          "#8b5cf6",
          "#fb923c"
        ][Math.floor(Math.random() * 6)];
        el.style.animationDelay = Math.random() * 0.5 + "s";
        el.style.animationDuration = 2 + Math.random() * 1.5 + "s";
        container.appendChild(el);
        timers.push(window.setTimeout(() => el.remove(), 4000));
      }

      return () => {
        timers.forEach(window.clearTimeout);
        container.querySelectorAll(".confetti-piece").forEach((el) => el.remove());
      };
    }
  }, [submitted]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleRatingClick = (value) => {
    if (user?.isGuest) return;
    setRating(value);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.isGuest) return;
    if (rating === 0 || submitting) return;

    const avatar = funEmojis[Math.floor(Math.random() * funEmojis.length)];
    const payload = {
      name: formData.name || "Anonymous Friend",
      rating: rating,
      avatar: avatar,
      text: formData.experience || `${ratingLabels[rating - 1]} Love this app!`,
      isVerifiedUser: !!user,
      allowSharing: !!formData.allowSharing,
      email: formData.email || undefined
    };

    setSubmitting(true);
    try {
      const res = await submitFeedback(payload);
      if (res && res.success && payload.allowSharing) {
        const created = res.feedback || {};
        setLocalTestimonials((prev) => [
          {
            id: created._id || Date.now(),
            name: created.name || payload.name,
            rating: Number(created.rating) || payload.rating,
            avatar: created.avatar || payload.avatar,
            text: created.text || payload.text,
            date: "Just now",
            verified: !!created.isVerifiedUser || !!user,
            likes: Number(created.likes) || 0
          },
          ...prev
        ]);
        setStats((s) => ({
          ...s,
          totalFeedbackCount: s.totalFeedbackCount + 1,
          publicReviewCount: s.publicReviewCount + 1
        }));
      } else if (res && res.success) {
        setStats((s) => ({ ...s, totalFeedbackCount: s.totalFeedbackCount + 1 }));
      }
      setSubmitted(true);
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setFormData({
          name: user?.username || "",
          email: "",
          experience: "",
          allowSharing: true,
          isVerifiedUser: !!user
        });
        if (payload.allowSharing) {
          setActiveTab("wall");
        } else {
          setActiveTab("rate");
        }
        resetTimerRef.current = null;
      }, 3200);
    } catch (err) {
      const msg =
        err && err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Couldn't submit right now. Your review matters — please try again!";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (id) => {
    if (user?.isGuest) return;
    const wasLiked = likedIds.has(id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLocalTestimonials((t) =>
      t.map((x) =>
        x.id === id
          ? { ...x, likes: Math.max(0, x.likes + (wasLiked ? -1 : 1)) }
          : x
      )
    );
    try {
      const res = await toggleLikeFeedback(id);
      if (res && res.success) {
        setLocalTestimonials((t) =>
          t.map((x) =>
            x.id === id
              ? { ...x, likes: typeof res.likes === "number" ? res.likes : x.likes }
              : x
          )
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (res.liked) next.add(id);
          else next.delete(id);
          return next;
        });
        setStats((s) => ({
          ...s,
          totalLikes: Math.max(0, (s.totalLikes || 0) + (res.liked ? 1 : -1))
        }));
      }
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      setLocalTestimonials((t) =>
        t.map((x) =>
          x.id === id
            ? { ...x, likes: Math.max(0, x.likes + (wasLiked ? 1 : -1)) }
            : x
        )
      );
    }
  };

  const avgRating = localTestimonials.length
    ? localTestimonials.reduce((sum, t) => sum + t.rating, 0) / localTestimonials.length
    : (stats.avgRating || 0);

  const totalFeedbackCount = stats.totalFeedbackCount || 0;

  const rotationMap = useMemo(() => {
    const map = new Map();
    localTestimonials.forEach((t, i) => {
      const seed = typeof t.id === "number" ? t.id : (typeof t.id === "string" ? t.id.charCodeAt(0) * 9301 : i);
      const frac = (Math.sin(seed * 9301 + 49297) * 233280) % 1;
      const abs = 0.4 + Math.abs(frac) * 0.8;
      map.set(t.id, (i % 2 === 0 ? -1 : 1) * abs);
    });
    return map;
  }, [localTestimonials]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          className="feedback-modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            key="modal"
            className="feedback-modal"
            ref={modalInnerRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            initial={{ opacity: 0, scale: 0.5, y: 60, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 40, rotate: 4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div ref={confettiContainerRef} className="confetti-container"></div>

            <button className="feedback-close-btn" onClick={onClose} aria-label="Close feedback modal">
              <X size={22} />
            </button>

            <div className="feedback-header feedback-section">
              <div className="feedback-header-icon">
                <MessageSquareHeart size={38} />
              </div>
              <div>
                <h2 className="feedback-title" id="feedback-modal-title">
                  <span className="gradient-text">Share the Joy!</span>
                </h2>
                <p className="feedback-subtitle">
                  Your voice fuels the laughter 💖
                </p>
              </div>
            </div>

            <div className="feedback-tabs feedback-section">
              <button
                className={`feedback-tab ${activeTab === "rate" ? "active" : ""}`}
                onClick={() => setActiveTab("rate")}
              >
                <Star size={18} /> Rate & Review
              </button>
              <button
                className={`feedback-tab ${activeTab === "github" ? "active" : ""}`}
                onClick={() => setActiveTab("github")}
              >
                <GithubIcon size={18} /> Support
              </button>
              <button
                className={`feedback-tab ${activeTab === "wall" ? "active" : ""}`}
                onClick={() => setActiveTab("wall")}
              >
                <Award size={18} /> Love Wall ({localTestimonials.length})
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "rate" && !submitted && (
                <motion.div
                  key="rate"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="feedback-content"
                >
                  <div className="feedback-section rating-section">
                    <h3 className="section-heading">
                      <Sparkles size={20} /> How was your Laughify experience?
                    </h3>
                    <div className="stars-container">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = (hoverRating || rating) >= n;
                        return (
                          <button
                            key={n}
                            className={`star-btn ${filled ? "filled" : ""}`}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRatingClick(n)}
                            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                          >
                            <Star
                              size={50}
                              fill={filled ? "#fbbf24" : "none"}
                              strokeWidth={2.5}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {(hoverRating || rating) > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rating-label"
                      >
                        {ratingLabels[(hoverRating || rating) - 1]}
                      </motion.p>
                    )}
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="feedback-section feedback-form"
                  >
                    <h3 className="section-heading">
                      <Heart size={20} /> Tell us your story!
                    </h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Your Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Laughing Legend"
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email (optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="for shoutouts!"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Your Experience</label>
                      <textarea
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="What made you laugh? Your favorite level? Did you beat a friend? We want it all! 🎉"
                        className="form-input form-textarea"
                      />
                    </div>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="allowSharing"
                        checked={formData.allowSharing}
                        onChange={handleInputChange}
                      />
                      <span>
                        Display my story on the Love Wall so others can see! 🌟
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="btn-primary submit-btn"
                      disabled={rating === 0 || submitting}
                    >
                      {submitting ? (
                        <><Loader2 size={20} className="spin-icon" /> Sending...</>
                      ) : (
                        <><Send size={20} /> Send My Feedback!</>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {submitted && (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="feedback-content success-content feedback-section"
                >
                  <motion.div
                    animate={{
                      rotate: [0, -12, 12, -6, 6, 0],
                      scale: [1, 1.1, 1, 1.15, 1]
                    }}
                    transition={{ duration: 1.2 }}
                    className="success-icon"
                  >
                    <PartyPopperIcon size={90} />
                  </motion.div>
                  <h2 className="success-title gradient-text">YOU'RE AWESOME!</h2>
                  <p className="success-subtitle">
                    Thank you for your feedback,{" "}
                    <strong>{formData.name || "friend"}</strong>! Your{" "}
                    {rating}-star review means the world to us. 💫
                  </p>
                  <p className="success-tip">
                    Taking you to the Love Wall... ✨
                  </p>
                </motion.div>
              )}

              {activeTab === "github" && (
                <motion.div
                  key="github"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="feedback-content"
                >
                  <div className="feedback-section github-section">
                    <div className="github-card glass-card">
                      <div className="github-icon-wrap">
                        <GithubIcon size={70} />
                      </div>
                      <h3 className="github-heading">
                        Help Laughify Grow! 🌱
                      </h3>
                      <p className="github-text">
                        This project is crafted with <Heart size={16} style={{ display: "inline-block", verticalAlign: "text-bottom", fill: "#ec4899", margin: "0 2px" }} /> by a student developer.
                        Your star on GitHub helps other laughter-lovers find us,
                        and following means you'll catch every hilarious update!
                      </p>

                      <div className="github-stats">
                        <div className="stat-item">
                          <Users size={22} />
                          <div>
                            <span className="stat-num">{totalFeedbackCount > 0 ? totalFeedbackCount : "—"}</span>
                            <span className="stat-label">Feedback Shared</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <Trophy size={22} />
                          <div>
                            <span className="stat-num">{avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "— ★"}</span>
                            <span className="stat-label">Avg Rating</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <Award size={22} />
                          <div>
                            <span className="stat-num">{localTestimonials.length > 0 ? localTestimonials.length : "—"}</span>
                            <span className="stat-label">Public Reviews</span>
                          </div>
                        </div>
                      </div>

                      <div className="github-actions">
                        <a
                          href={GITHUB_REPO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary github-btn"
                        >
                          <Star size={20} fill="#fff" /> Star the Repo
                        </a>
                        <a
                          href={GITHUB_REPO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary github-btn"
                        >
                          <GithubIcon size={20} /> Follow for Updates
                        </a>
                      </div>

                      <p className="github-note">
                        <Sparkles size={14} /> Starring takes 2 seconds and helps a ton!
                        Plus you'll get bragging rights as an OG Laughify supporter. 🎖️
                      </p>
                    </div>
                  </div>

                  <div className="feedback-section proof-section">
                    <h3 className="section-heading">
                      <Camera size={20} /> Ways people enjoy Laughify
                    </h3>
                    <p className="proof-subheading">
                      Real use-case scenarios the game is built for
                    </p>
                    <div className="proof-grid">
                      <div className="proof-card proof-card-1">
                        <div className="proof-emoji">👨‍👩‍👧</div>
                        <p className="proof-text">
                          Perfect for family game nights — quick rounds + the
                          post-loss screenshots become fridge-worthy memories.
                        </p>
                        <span className="proof-tag">Example · Family Night</span>
                      </div>
                      <div className="proof-card proof-card-2">
                        <div className="proof-emoji">🎓</div>
                        <p className="proof-text">
                          Great as a classroom or club icebreaker — nothing
                          breaks awkward silence like watching the teacher laugh.
                        </p>
                        <span className="proof-tag">Example · Classroom</span>
                      </div>
                      <div className="proof-card proof-card-3">
                        <div className="proof-emoji">💼</div>
                        <p className="proof-text">
                          Makes team-building genuinely fun. Add a Slack channel
                          for the screenshots and the internet never forgets.
                        </p>
                        <span className="proof-tag">Example · Team Building</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "wall" && (
                <motion.div
                  key="wall"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="feedback-content wall-content"
                >
                  <div className="feedback-section wall-header">
                    <div className="wall-summary glass-card">
                      <div className="wall-rating">
                        <span className="wall-rating-num">
                          {localTestimonials.length > 0 ? avgRating.toFixed(1) : "—"}
                        </span>
                        <div className="wall-stars">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={22}
                              fill={n <= Math.round(avgRating) && localTestimonials.length > 0 ? "#fbbf24" : "none"}
                              strokeWidth={2}
                            />
                          ))}
                        </div>
                        <span className="wall-count">
                          {localTestimonials.length === 0
                            ? "Be the first to leave a review!"
                            : `${localTestimonials.length} public review${localTestimonials.length === 1 ? "" : "s"}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="feedback-section wall-empty glass-card">
                      <Loader2 size={40} className="spin-icon" style={{ color: "#f472b6" }} />
                      <p className="wall-empty-desc" style={{ marginTop: "16px" }}>
                        Loading the Love Wall...
                      </p>
                    </div>
                  ) : loadError ? (
                    <div className="feedback-section wall-empty glass-card">
                      <div className="wall-empty-emoji">😵</div>
                      <h3 className="wall-empty-title">{loadError}</h3>
                      <p className="wall-empty-desc">
                        The server might be offline. Make sure the Laughify backend is running!
                      </p>
                      <button
                        type="button"
                        className="btn-primary wall-empty-btn"
                        onClick={() => loadFeedbackSummary()}
                      >
                        <Sparkles size={18} /> Try Again
                      </button>
                    </div>
                  ) : localTestimonials.length === 0 ? (
                    <div className="feedback-section wall-empty glass-card">
                      <div className="wall-empty-emoji">✨</div>
                      <h3 className="wall-empty-title">No reviews yet — but yours could be first!</h3>
                      <p className="wall-empty-desc">
                        Jump back to the <strong>Rate & Review</strong> tab, share your experience,
                        and your story will appear right here. 100% real reviews from real
                        players only — zero fluff, zero fakes. 🚫🧢
                      </p>
                        <button
                          className="btn-primary wall-empty-btn"
                          onClick={() => setActiveTab("rate")}
                        >
                        <Star size={18} /> Write the First Review
                      </button>
                    </div>
                  ) : (
                    <div className="wall-list">
                      {localTestimonials.map((t, i) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 20, x: (i % 2 === 0 ? -1 : 1) * 10 }}
                          animate={{ opacity: 1, y: 0, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`feedback-section testimonial-card ${t.verified ? "verified" : ""}`}
                          style={{ rotate: rotationMap.get(t.id) ?? 0 }}
                        >
                          <div className="testi-top">
                            <div className="testi-avatar">{t.avatar}</div>
                            <div className="testi-info">
                              <div className="testi-name-row">
                                <span className="testi-name">{t.name}</span>
                                {t.verified && (
                                  <span className="verified-badge">
                                    <Award size={12} /> Verified Player
                                  </span>
                                )}
                              </div>
                              <div className="testi-stars">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={n}
                                    size={14}
                                    fill={n <= t.rating ? "#fbbf24" : "none"}
                                    strokeWidth={2.5}
                                  />
                                ))}
                                <span className="testi-date">· {t.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="testi-text">{t.text}</p>
                          <div className="testi-actions">
                            <button
                              className={`like-btn ${likedIds.has(t.id) ? "liked" : ""}`}
                              onClick={() => toggleLike(t.id)}
                              aria-label={`${likedIds.has(t.id) ? "Unlike" : "Like"} ${t.name}'s review`}
                            >
                              <ThumbsUp size={16} />
                              <span>{t.likes}</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
