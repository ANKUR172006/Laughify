import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/game",
  withCredentials: true,
});

export async function getVideoByLevel(level) {
  const response = await api.get(`/video/${level}`);
  return response.data;
}

export async function uploadUserPhoto(level, imageData) {
  const response = await api.post("/photo", { level, imageData });
  return response.data;
}

export async function updateHighestLevel(level) {
  const response = await api.post("/highest-level", { level });
  return response.data;
}

export async function getProfile() {
  const response = await api.get("/profile");
  return response.data;
}

export async function getLeaderboard() {
  const response = await api.get("/leaderboard");
  return response.data;
}
