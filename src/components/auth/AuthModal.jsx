import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  User,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const {
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    loginGoogle,
    loginEmailOrUsername,
    registerEmailOrUsername
  } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        await registerEmailOrUsername(identifier.trim(), password, displayName.trim());
      } else {
        await loginEmailOrUsername(identifier.trim(), password);
      }
      onClose();
    } catch {
      // error is handled inside auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await loginGoogle();
      onClose();
    } catch {
      // error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 neon-glow-teal flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mb-3 shadow-lg shadow-teal-500/20">
            {authMode === 'signup' ? (
              <UserPlus className="w-7 h-7 text-teal-400" />
            ) : (
              <LogIn className="w-7 h-7 text-teal-400" />
            )}
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {authMode === 'signup' ? 'Create Student Account' : 'Welcome to Notes Vault'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            {authMode === 'signup'
              ? 'Save your personal quiz scores, track mastered topics, and ask doubts!'
              : 'Sign in to access your personal study history and doubts.'}
          </p>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold font-sans text-xs flex items-center justify-center space-x-3 transition shadow-md disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest">
            or with credentials
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Tabs for Login vs Sign Up */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold transition ${
              authMode === 'login'
                ? 'bg-teal-500/20 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setAuthError('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold transition ${
              authMode === 'signup'
                ? 'bg-teal-500/20 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {authMode === 'signup' && (
            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-bold">YOUR NAME / DISPLAY NAME</label>
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aman Kumar"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-[10px] mb-1 font-bold">
              {authMode === 'signup' ? 'USERNAME OR EMAIL' : 'USERNAME OR EMAIL'}
            </label>
            <div className="relative flex items-center">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. aman_dev or aman@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1 font-bold">PASSWORD</label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
              />
            </div>
          </div>

          {authError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : authMode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-4">
          Notes can always be browsed freely without an account.
        </p>
      </div>
    </div>
  );
}
