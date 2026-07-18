import Protected from "./features/auth/components/Protected";
import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import Login from "./features/auth/page/Login";
import Register from "./features/auth/page/Register";
import HomePage from "./features/game/page/HomePage";
import GamePage from "./features/game/page/GamePage";
import LosePage from "./features/game/page/LosePage";
import LevelCompletePage from "./features/game/page/LevelCompletePage";
import ProfilePage from "./features/game/page/ProfilePage";
import LeaderboardPage from "./features/game/page/LeaderboardPage";
import Scene3D from "./features/shared/components/Scene3D";

function RootLayout() {
  const location = useLocation();
  const show3DScene = !['/login', '/register'].includes(location.pathname);

  return (
    <>
      {show3DScene && <Scene3D />}
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/game",
        element: <GamePage />,
      },
      {
        path: "/lose",
        element: <LosePage />,
      },
      {
        path: "/level-complete",
        element: <LevelCompletePage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/leaderboard",
        element: <LeaderboardPage />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
]);
