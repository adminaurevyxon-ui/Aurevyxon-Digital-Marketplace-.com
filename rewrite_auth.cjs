const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

code = code.replace(
  /import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase\/auth";/,
  `import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";`
);

code = code.replace(
  `  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthError(error.message || "Failed to sign in");
    }
  };`,
  `  const login = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthError(error.message || "Failed to sign in");
      throw error;
    }
  };`
);

code = code.replace(
  `  useEffect(() => {
    // Check initial local token`,
  `  useEffect(() => {
    const checkRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err: any) {
        console.error("Redirect login error:", err);
        setAuthError(err.message);
      }
    };
    checkRedirect();

    // Check initial local token`
);

fs.writeFileSync('src/lib/auth.tsx', code);
