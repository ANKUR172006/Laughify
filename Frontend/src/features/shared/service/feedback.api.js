import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/",
  withCredentials: true,
});

export async function submitFeedback(payload) {
  const response = await api.post("/api/feedback/", payload);
  return response.data;
}

export async function getPublicFeedback() {
  const response = await api.get("/api/feedback/public");
  return response.data;
}

export async function getFeedbackStats() {
  const response = await api.get("/api/feedback/stats");
  return response.data;
}

export async function toggleLikeFeedback(feedbackId) {
  const response = await api.post(`/api/feedback/${feedbackId}/like`);
  return response.data;
}
