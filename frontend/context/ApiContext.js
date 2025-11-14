// context/ApiContext.js
import { createContext, useContext } from "react";

// Create context
const ApiContext = createContext();

// Provider
export function ApiProvider({ children }) {
  // Always resolve to NEXT_PUBLIC_API_URL if available
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <ApiContext.Provider value={{ apiBaseUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

// Hook
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used inside ApiProvider");
  }
  return context;
}
