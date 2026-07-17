/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);

  const unlockNextLevel = () => {
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
