// src/components/AuthPortal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Role } from '../types';
import { countries, states, districts } from '../services/locationData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ArrowLeft, Check, X, AtSign, Languages } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface RegistrationData {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  collegeName: string;
  country: string;
  state: string;
  district: string;
  googleUser?: User;
}

interface AuthPortalProps {
  onLogin: (email: string, pass: string) => Promise<string | null>;
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; error?: string; email?: string; requiresVerification?: boolean }>;
  onGoogleSignIn: () => Promise<{ error?: string; isNewUser?: boolean; googleUser?: User }>;
  onForgotPassword: (email: string) => Promise<string | null>;
  onRegistrationSuccess: (email: string) => void;
}

const PasswordInput = ({ value, onChange, placeholder, error }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("pr-10 h-10 bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700", error && "border-destructive focus-visible:ring-destructive")}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLogin,
  onRegister,
  onGoogleSignIn,
  onForgotPassword,
  onRegistrationSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Username Logic
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error' | 'invalid'>('idle');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    name: '',
    email: '',
    role: Role.Student,
    collegeName: '',
    country: '',
    state: '',
    district: '',
  });
  const [password, setPassword] = useState('');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    setStep(1);
    if (!isLogin && !isGoogleAuth) {
      setFormData(prev => ({ ...prev, name: '', email: '', username: '' }));
      setPassword('');
      setUsernameStatus('idle');
    }
  }, [isLogin, isForgotPass]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, state: '', district: '' }));
  }, [formData.country]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, district: '' }));
  }, [formData.state]);

  const checkUsername = async (username: string) => {
    if (!username || username.length < 4) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      setUsernameStatus(querySnapshot.empty ? 'available' : 'taken');
    } catch (err) {
      console.error("Username check error:", err);
      setUsernameStatus('idle');
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setError(null);

    if (field === 'username') {
      const cleanValue = value.toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);

      setFormData(prev => ({ ...prev, username: cleanValue }));

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (cleanValue.length === 0) {
        setUsernameStatus('idle');
      } else if (cleanValue.length < 4) {
        setUsernameStatus('invalid');
      } else {
        setUsernameStatus('checking');
        debounceTimer.current = setTimeout(() => checkUsername(cleanValue), 500);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGoogleSignIn();
      if (result.error) {
        setError(result.error);
      } else if (result.isNewUser && result.googleUser) {
        setIsGoogleAuth(true);
        setGoogleUser(result.googleUser);
        setIsLogin(false);
        setFormData(prev => ({
          ...prev,
          email: result.googleUser!.email || '',
          name: result.googleUser!.displayName || '',
        }));
        setStep(2);
      }
    } catch (err) {
      setError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep: number) => {
    if (isForgotPass) {
      if (!formData.email || !formData.email.includes('@')) return "Enter a valid email.";
      return null;
    }
    if (isLogin) {
      if (!formData.email || !password) return "Please enter email and password.";
      return null;
    }

    if (currentStep === 1) {
      if (!formData.email.includes('@')) return "Invalid email address.";
      if (password.length < 6) return "Password must be at least 6 characters.";
    }

    if (currentStep === 2) {
      if (formData.username.length < 4) return "Username must be at least 4 characters.";
      if (usernameStatus === 'taken') return "Username is already taken.";
      if (usernameStatus === 'invalid') return "Invalid username format.";
      if (!formData.name.trim()) return "Full name is required.";
    }

    if (currentStep === 3) {
      if (!formData.collegeName) return "College name is required.";
      if (!formData.country || !formData.state || !formData.district) return "Please complete location details.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(isLogin ? 0 : step);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      if (isForgotPass) {
        const errorMsg = await onForgotPassword(formData.email.trim());
        if (errorMsg) setError(errorMsg);
        else setSuccessMsg(`Reset link sent to ${formData.email}. Please check your inbox.`);
      } else if (isLogin) {
        const errorMsg = await onLogin(formData.email.trim(), password);
        if (errorMsg) setError(errorMsg);
      } else {
        const res = await onRegister({
          ...formData,
          email: formData.email.trim(),
          password: isGoogleAuth ? undefined : password,
          googleUser: googleUser || undefined
        });

        if (res.error) {
          setError(res.error);
        } else if (res.success && res.email) {
          if (res.requiresVerification !== false) {
            onRegistrationSuccess(res.email);
          }
        }
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* --- Left Panel: Visuals & Branding --- */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0F172A] relative overflow-hidden text-white">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[80px]" />

        {/* Glass Effect Overlay could go here if needed, but clean is better */}

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-xl font-bold">Q</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Quizapo</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Assessments <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Reimagined.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            The intelligent platform for modern examinations. Secure, scalable, and powered by AI.
          </p>
        </div>

        <div className="relative z-10">
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 max-w-sm">
            <p className="text-sm text-slate-300 italic mb-4">
              "Quizapo has completely transformed how we conduct assessments. The interface is stunning and the AI features are game-changing."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold">Dr</div>
              <div>
                <div className="text-sm font-semibold">Dr. Sarah Jenkin</div>
                <div className="text-xs text-slate-500">Dean of Sciences</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Panel: Form --- */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-black">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

          {/* Mobile Branding (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-2">
              <span className="text-2xl font-bold text-white">Q</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">
              {isForgotPass ? "Reset Password" : isLogin ? "Welcome back" : isGoogleAuth ? "Complete Setup" : "Create an account"}
            </h2>
            <p className="text-muted-foreground">
              {isForgotPass ? "Enter your email to receive recovery instructions" : isLogin
                ? "Enter your credentials to access your account"
                : "Enter your details to get started with Quizapo"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMsg && (
              <Alert className="bg-green-50 text-green-700 border-green-200 animate-in slide-in-from-top-2">
                <Check className="h-4 w-4" />
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}

            {isLogin && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@example.com"
                    className="h-10 bg-gray-50 dark:bg-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isForgotPass && !isLogin && step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@example.com"
                    className="h-10 bg-gray-50 dark:bg-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Create Password</Label>
                  <PasswordInput
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
            )}

            {!isForgotPass && !isLogin && step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="h-10 bg-gray-50 dark:bg-zinc-800/50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="username">Username</Label>
                    <span className={cn(
                      "text-[10px] font-mono transition-colors",
                      formData.username.length >= 13 ? "text-orange-500 font-bold" : "text-muted-foreground"
                    )}>
                      {formData.username.length}/15
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center h-11 w-full rounded-md border border-input bg-gray-50 dark:bg-zinc-800/50 px-3 py-1 ring-offset-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    usernameStatus === 'taken' && "border-red-500 focus-within:ring-red-500/20 bg-red-50/10",
                    usernameStatus === 'available' && "border-green-500 focus-within:ring-green-500/20 bg-green-50/10",
                    usernameStatus === 'invalid' && "border-orange-400 focus-within:ring-orange-400/20"
                  )}>
                    <span className="text-muted-foreground mr-1 font-medium select-none">@</span>
                    <input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="username"
                      maxLength={15}
                      className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground font-medium tracking-tight h-full w-full"
                    />
                    <div className="flex items-center gap-2">
                      {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-600 font-bold" />}
                      {usernameStatus === 'taken' && <X className="h-4 w-4 text-red-500 font-bold" />}
                      {usernameStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                    </div>
                  </div>

                  <div className="flex justify-between items-start min-h-[1.25rem]">
                    <p className={cn("text-xs transition-colors font-medium",
                      usernameStatus === 'taken' ? "text-red-500" :
                        usernameStatus === 'available' ? "text-green-600" :
                          usernameStatus === 'invalid' ? "text-orange-500" : "text-muted-foreground")
                    }>
                      {usernameStatus === 'taken' ? "This username is already taken." :
                        usernameStatus === 'available' ? "Username available." :
                          usernameStatus === 'invalid' ? "Min 4 characters." :
                            "Use letters, numbers, and underscores."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isForgotPass && !isLogin && step === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={formData.collegeName}
                    onChange={(e) => handleInputChange('collegeName', e.target.value)}
                    placeholder="University Name"
                    className="h-10 bg-gray-50 dark:bg-zinc-800/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                      <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-800/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={(v) => handleInputChange('state', v)} disabled={!formData.country}>
                      <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-800/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{(states[formData.country] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={formData.district} onValueChange={(v) => handleInputChange('district', v)} disabled={!formData.state}>
                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-zinc-800/50"><SelectValue placeholder="Select District" /></SelectTrigger>
                    <SelectContent>{(districts[formData.state] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!isForgotPass && (
              <div className="pt-2">
                {isLogin ? (
                  <Button type="submit" disabled={loading} className="w-full h-11 text-base font-medium shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 transition-all rounded-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="w-1/3 h-11 rounded-full border-gray-200">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                    )}
                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={step === 2 && (usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid')}
                        className={cn("h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 font-medium transition-all", step > 1 ? "w-2/3" : "w-full")}
                      >
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={loading} className="w-full h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-500/20">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isForgotPass && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-zinc-800" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-black px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
            )}

            {!isForgotPass && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-11 rounded-full border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 font-medium transition-all"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.011 35.091 44 30.025 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                </svg>
                Google
              </Button>
            )}

            {!isForgotPass && (
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;