import React, { useState } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2,
  Layers,
  HelpCircle
} from 'lucide-react';
import { UserProfile, UserRole, SignLanguageCode } from '../types';
import { SIGN_LANGUAGES } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [name, setName] = useState<string>(currentUser.name);
  const [email, setEmail] = useState<string>(currentUser.email);
  const [password, setPassword] = useState<string>('••••••••');
  const [primaryLang, setPrimaryLang] = useState<SignLanguageCode>(currentUser.primaryLanguage);
  const [certification, setCertification] = useState<string>('RID Certified (CI/CT)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name: name || 'Alex Morgan',
      email: email || 'alex.morgan@example.com',
      role,
      primaryLanguage: primaryLang,
      certifications: role === 'interpreter' ? [certification, 'NIC Master'] : undefined,
      verified: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {authMode === 'signin' ? 'Sign In to SignLink' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authMode === 'signin' 
              ? 'Access real-time sign language translation & live interpreter calls' 
              : 'Join the community of signers, learners, and certified interpreters'}
          </p>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {['Google', 'Apple', 'Microsoft'].map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={handleSubmit}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-2xs"
            >
              {prov}
            </button>
          ))}
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase text-slate-400 absolute">
            Or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Account Role Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('user_deaf')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'user_deaf'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] block">Deaf / Signer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('user_hearing')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'user_hearing'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold'
                }`}
              >
                <Layers className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] block">Learner / Ally</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('interpreter')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'interpreter'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] block">Interpreter Pro</span>
              </button>
            </div>
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          {role === 'interpreter' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-xs">
              <label className="font-bold text-purple-900 dark:text-purple-300 block mb-1">
                Primary Certification / Accreditation
              </label>
              <select
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="RID Certified (CI/CT)">RID Certified (CI/CT) - USA</option>
                <option value="NIC Master">NIC Master - Registry of Interpreters for the Deaf</option>
                <option value="Certified Deaf Interpreter (CDI)">Certified Deaf Interpreter (CDI)</option>
                <option value="NRCPD Registered BSL">NRCPD Registered - United Kingdom</option>
                <option value="NAATI Certified Auslan">NAATI Certified - Australia</option>
              </select>
            </div>
          )}

          {/* Primary Language */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Primary Sign Language
            </label>
            <select
              value={primaryLang}
              onChange={(e) => setPrimaryLang(e.target.value as SignLanguageCode)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              {SIGN_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name} ({l.code})</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1 mt-6"
          >
            <span>{authMode === 'signin' ? 'Sign In & Continue' : 'Create Verified Profile'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch Sign In vs Sign Up */}
        <div className="text-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            {authMode === 'signin'
              ? "Don't have an account? Sign up with tutorial options"
              : 'Already have an account? Sign in here'}
          </button>
        </div>

      </div>
    </div>
  );
};
