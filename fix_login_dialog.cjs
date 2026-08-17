const fs = require('fs');

const loginDialog = `import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { Mail, Lock, User, AlertCircle, ArrowLeft, MailOpen } from "lucide-react";
import { toast } from "sonner";

export function LoginDialog({ children }: { children: ReactNode }) {
  const { login: googleLogin, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setError('');
    }
  }, [open]);

  // Close if authenticated (unless they just registered and need to verify)
  useEffect(() => {
    if (isAuthenticated && mode !== 'verify') {
       if (auth.currentUser && !auth.currentUser.emailVerified && auth.currentUser.providerData.some(p => p.providerId === 'password')) {
           setMode('verify');
       } else {
           setOpen(false);
       }
    }
  }, [isAuthenticated, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            setMode('verify');
            setLoading(false);
            return;
        }
        setOpen(false);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
            await updateProfile(userCredential.user, { displayName: name });
        }
        await sendEmailVerification(userCredential.user);
        toast("Verification email sent!");
        setMode('verify');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        toast("Password reset email sent! Please check your inbox.");
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
          setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
          setError("Email is already in use.");
      } else {
          setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
      setLoading(true);
      try {
          if (auth.currentUser) {
             await sendEmailVerification(auth.currentUser);
             toast("Verification email resent!");
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await googleLogin();
          // googleLogin handles popup. If successful, auth state changes and dialog will close.
      } catch (err: any) {
          setError(err.message);
          setLoading(false);
      }
  };

  return (
    <>
      <div 
        className="inline-block w-full sm:w-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isAuthenticated) {
              if (auth.currentUser && !auth.currentUser.emailVerified && auth.currentUser.providerData.some(p => p.providerId === 'password')) {
                  setMode('verify');
                  setOpen(true);
              }
              // If already authenticated and verified, no need to open, or maybe they just wanted to login.
          } else {
              setOpen(true);
          }
        }}
      >
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
         <DialogContent className="sm:max-w-[425px] bg-[#0A0A0F] border border-border p-6 shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display font-bold text-center">
                 {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Verify Email'}
              </DialogTitle>
              <DialogDescription className="text-center">
                 {mode === 'login' ? 'Enter your credentials to access your account' : 
                  mode === 'register' ? 'Join OMNIVERSE today' : 
                  mode === 'forgot' ? 'We will send you a link to reset your password' :
                  'Please check your inbox to verify your email address'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 {error}
              </div>
            )}

            {mode === 'verify' ? (
                <div className="flex flex-col items-center gap-6 py-4 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
                        <MailOpen className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-4">
                            We've sent a verification email to <strong className="text-foreground">{auth.currentUser?.email || email}</strong>.
                            Please click the link in the email to verify your account.
                        </p>
                        <Button 
                            variant="outline" 
                            className="w-full border-border bg-muted/50" 
                            onClick={handleResendVerification}
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Resend Verification Email"}
                        </Button>
                    </div>
                    <Button variant="ghost" className="text-xs text-muted-foreground" onClick={() => { auth.signOut(); setOpen(false); }}>
                        Sign out
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-2">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Full Name" 
                                className="pl-9 bg-muted/50 border-border" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                        </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            type="email" 
                            placeholder="Email Address" 
                            className="pl-9 bg-muted/50 border-border" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                      <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                type="password" 
                                placeholder="Password" 
                                className="pl-9 bg-muted/50 border-border" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                minLength={6}
                            />
                        </div>
                      </div>
                  )}

                  {mode === 'register' && (
                      <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                type="password" 
                                placeholder="Confirm Password" 
                                className="pl-9 bg-muted/50 border-border" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                                minLength={6}
                            />
                        </div>
                      </div>
                  )}

                  {mode === 'login' && (
                      <div className="flex justify-end">
                          <button 
                            type="button" 
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                            onClick={() => setMode('forgot')}
                          >
                              Forgot Password?
                          </button>
                      </div>
                  )}

                  <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white" disabled={loading}>
                      {loading ? "Processing..." : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                  </Button>

                  {mode === 'login' && (
                      <>
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/50"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-[#0A0A0F] px-2 text-muted-foreground">Or continue with</span>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full bg-white text-black hover:bg-gray-100 border-none"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                          >
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              Continue with Google
                          </Button>
                      </>
                  )}

                  <div className="text-center mt-6 text-sm text-muted-foreground">
                      {mode === 'login' ? (
                          <>
                              Don't have an account?{" "}
                              <button type="button" className="text-indigo-400 hover:text-indigo-300 font-medium" onClick={() => setMode('register')}>
                                  Sign up
                              </button>
                          </>
                      ) : mode === 'register' ? (
                          <>
                              Already have an account?{" "}
                              <button type="button" className="text-indigo-400 hover:text-indigo-300 font-medium" onClick={() => setMode('login')}>
                                  Sign in
                              </button>
                          </>
                      ) : (
                          <button type="button" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 w-full" onClick={() => setMode('login')}>
                              <ArrowLeft className="w-4 h-4" /> Back to Sign in
                          </button>
                      )}
                  </div>
                </form>
            )}
         </DialogContent>
      </Dialog>
    </>
  );
}
`;

fs.writeFileSync('src/components/LoginDialog.tsx', loginDialog);
console.log("Patched LoginDialog.tsx");
