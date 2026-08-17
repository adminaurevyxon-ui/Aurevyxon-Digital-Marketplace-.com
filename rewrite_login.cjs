const fs = require('fs');
let code = fs.readFileSync('src/components/LoginDialog.tsx', 'utf8');

code = code.replace(
  `const { login: googleLogin, isAuthenticated } = useAuth();`,
  `const { login: googleLogin, isAuthenticated, authError: globalAuthError, clearError: clearGlobalError } = useAuth();`
);

code = code.replace(
  `  // Close if authenticated (unless they just registered and need to verify)
  useEffect(() => {`,
  `  useEffect(() => {
    if (globalAuthError) {
      setError(globalAuthError);
      setLoading(false);
      clearGlobalError();
    }
  }, [globalAuthError, clearGlobalError]);

  // Close if authenticated (unless they just registered and need to verify)
  useEffect(() => {`
);

code = code.replace(
  `  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await googleLogin();
          // googleLogin handles popup. If successful, auth state changes and dialog will close.
      } catch (err: any) {
          setError(err.message);
          setLoading(false);
      }
  };`,
  `  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await googleLogin();
          // googleLogin handles popup. If successful, auth state changes and dialog will close.
      } catch (err: any) {
          if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
              setError(err.message);
          }
          setLoading(false);
      }
  };`
);

fs.writeFileSync('src/components/LoginDialog.tsx', code);
