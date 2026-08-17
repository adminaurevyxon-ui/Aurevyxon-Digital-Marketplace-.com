import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safeJson } from "./utils";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./firebase";
import { persistUserToFirestore } from "./firestoreService";

type User = { id: string; name: string; email: string; role?: string; photoURL?: string; seller_profile?: any };

interface AuthContextType {
  user: User | null;
  token: string | null;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  authError: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  clearError: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem("aurevyxon_token");
    if (!currentToken) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data && data.user) {
          setUser(data.user);
          setToken(currentToken);
        }
      }
    } catch (e) {
      console.warn("Failed to refresh user profile:", e);
    }
  };

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Firebase Auth persistence initialization error:", err);
    });

    const checkRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err: any) {
        console.error("Redirect login error:", err);
        setAuthError(err.message);
      }
    };
    checkRedirect();

    // Fetch user immediately from local token if available
    const localToken = localStorage.getItem("aurevyxon_token");
    if (localToken) {
      setToken(localToken);
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${localToken}` }
      })
        .then(res => safeJson(res))
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
          }
        })
        .catch(err => console.warn("Initial session fetch error:", err));
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await fetch("/api/auth/firebase-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
          });
          
          if (!res.ok) { 
            const text = await res.text().catch(() => "");
            throw new Error(`Backend authentication failed: ${res.status} ${text}`); 
          }
          
          const data = await safeJson(res);
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem("aurevyxon_token", data.token);

          if (data.user) {
            persistUserToFirestore(data.user).catch((err) => console.warn("Firestore user sync warning:", err));
          }
        } catch (err: any) {
          console.warn("Auth sync error:", err);
          // Do not display raw network 'Failed to fetch' as persistent global auth error
          if (err?.message && !err.message.toLowerCase().includes("fetch")) {
            setAuthError(err.message || "Failed to sync with backend");
          }
        }
      } else {
        // Fallback check for local JWT token session when Firebase user is null
        const activeToken = localStorage.getItem("aurevyxon_token");
        if (activeToken) {
          try {
            const res = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${activeToken}` }
            });
            if (res.ok) {
              const data = await safeJson(res);
              if (data && data.user) {
                setUser(data.user);
                setToken(activeToken);
              }
            }
          } catch (e) {
            console.warn("Failed to verify local session token:", e);
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthError(error.message || "Failed to sign in");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("aurevyxon_token");
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const clearError = () => setAuthError(null);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground dark:text-white">Initializing System...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, authError, login, logout, refreshUser, clearError, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
