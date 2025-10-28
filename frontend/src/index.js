// src/index.js (or index.jsx) — imports moved to the top per eslint import/first

import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";

// State
import { Provider } from "react-redux";
import store from "./Redux/Store";

// UI & Theme
import {
  ChakraProvider,
  CSSReset,
  useToast,
  Spinner,
  extendTheme,
  ColorModeScript,
} from "@chakra-ui/react";

// App
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Analytics
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Styles
import "./index.css";

/* ────────────────────────────────────────────────────────────────────────────
   ✅ Theme
──────────────────────────────────────────────────────────────────────────── */
const theme = extendTheme({
  config: { initialColorMode: "light", useSystemColorMode: false },
});

/* ────────────────────────────────────────────────────────────────────────────
   🧯 Error Boundary
──────────────────────────────────────────────────────────────────────────── */
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  handleReset = () => {
    window.location.reload();
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <pre style={{ color: "#b00", whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   🔝 Scroll Restoration on route change
──────────────────────────────────────────────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
   🌍 Global Toast Provider (safe window bridge)
──────────────────────────────────────────────────────────────────────────── */
function GlobalToastProvider({ children }) {
  const toast = useToast();
  if (typeof window !== "undefined" && !window.ChakraToast) {
    window.ChakraToast = toast;
  }
  return children;
}

/* ────────────────────────────────────────────────────────────────────────────
   🧭 Router basename (CRA/Vite friendly)
──────────────────────────────────────────────────────────────────────────── */
const BASENAME =
  (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ||
  (typeof process !== "undefined" && process.env?.PUBLIC_URL) ||
  "/";

/* ────────────────────────────────────────────────────────────────────────────
   🚀 Boot & Render
──────────────────────────────────────────────────────────────────────────── */
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <CSSReset />
        <BrowserRouter basename={BASENAME}>
          <GlobalToastProvider>
            <RootErrorBoundary>
              <ScrollToTop />
              <Suspense
                fallback={
                  <div
                    style={{
                      height: "60vh",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Spinner thickness="4px" emptyColor="gray.200" size="xl" />
                  </div>
                }
              >
                <App />
              </Suspense>
              <Analytics />
              <SpeedInsights />
            </RootErrorBoundary>
          </GlobalToastProvider>
        </BrowserRouter>
      </ChakraProvider>
    </Provider>
  </React.StrictMode>
);

/* ────────────────────────────────────────────────────────────────────────────
   📊 Web Vitals
──────────────────────────────────────────────────────────────────────────── */
reportWebVitals();
