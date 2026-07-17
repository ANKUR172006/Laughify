import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/game",
  withCredentials: true,
});

export async function getVideoByLevel(level) {
  const response = await api.get(`/video/${level}`);
  return response.data;
}

export async function uploadUserPhoto(level, imageData, userId) {
  const response = await api.post("/photo", { level, imageData, userId });
  return response.data;
}

export async function updateHighestLevel(level) {
  const response = await api.post("/highest-level", { level });
  return response.data;
}
