/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "../../auth/authContext";

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    if (user?.isGuest && currentLevel > 1) {
      setCurrentLevel(1);
    }
  }, [user?.isGuest, currentLevel]);

  const unlockNextLevel = () => {
    if (user?.isGuest) {
      setCurrentLevel(1);
      return;
    }
    setCurrentLevel(prev => prev + 1);
  };

  return (
    <GameContext.Provider
      value={{
        currentLevel,
        setCurrentLevel,
        unlockNextLevel,
        isGameActive,
        setIsGameActive
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return context;
};
