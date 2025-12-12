import { createContext, useContext, useState, ReactNode } from "react";

type Theme = "green" | "purple";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    card: string;
    accent: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  green: {
    primary: "#2ecc40",
    secondary: "#f2f2f7",
    card: "#f2f2f7",
    accent: "#e5e5ea",
  },
  purple: {
    primary: "#a855f7",
    secondary: "#f2f2f7",
    card: "#f2f2f7",
    accent: "#e5e5ea",
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("green");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "green" ? "purple" : "green"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colors: themes[theme],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}