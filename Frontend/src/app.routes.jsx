import Protected from "./features/auth/components/Protected";
import { createBrowserRouter } from "react-router-dom";
import Login from "./features/auth/page/Login";
import Register from "./features/auth/page/Register";
import HomePage from "./features/game/page/HomePage";
import GamePage from "./features/game/page/GamePage";
import LosePage from "./features/game/page/LosePage";
import LevelCompletePage from "./features/game/page/LevelCompletePage";
import ProfilePage from "./features/game/page/ProfilePage";
import LeaderboardPage from "./features/game/page/LeaderboardPage";
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
     
        <Protected>
          <HomePage />
        </Protected>
     
    ),
  },
  {
    path: "/game",
    element: (
     
        <Protected>
          <GamePage />
        </Protected>
     
    ),
  },
  {
    path: "/lose",
    element: (
    
        <Protected>
          <LosePage />
        </Protected>
     
    ),
  },
  {
    path: "/level-complete",
    element: (
    
        <Protected>
          <LevelCompletePage />
        </Protected>
      
    ),
  },
  {
    path: "/profile",
    element: (
   
      <Protected>
        <ProfilePage />
      </Protected>
    
    ),
  },
  {
    path: "/leaderboard",
    element: (
     
      <Protected>
        <LeaderboardPage />
      </Protected>
    
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);
