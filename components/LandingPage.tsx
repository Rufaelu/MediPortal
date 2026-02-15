
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { HeartPulse, ShieldCheck, Activity, ChevronRight, Sparkles, User as UserIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const displayName = username || name || (email.split('@')[0]);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: displayName,
              role: role,
              photo: ''
            }
          }
        });
        if (error) throw error;

        // If auto-confirm is on, we get a session immediately.
        if (data.session) {
          // onAuthStateChange will pick this up
        } else if (data.user && !data.session) {
          // Email confirmation required
          alert('Registration successful! Please check your email for a confirmation link.');
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message.includes("Email not confirmed") || err.status === 400) {
        setError("Login failed: Email not confirmed or invalid credentials. Please check your inbox or Supabase Dashboard > Auth > Users.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen md:-mt-20 flex items-center bg-royal-blue overflow-hidden">
      {/* Immersive Background Image with Blue Tint */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 opacity-30 mix-blend-overlay"
        style={{ backgroundImage: "url('image.png')" }}
      />

      {/* Multi-layered dark blue gradients */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-royal-blue via-royal-blue/90 md:via-royal-blue/80 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-royal-blue via-transparent to-royal-blue/40" />

      <div className="relative z-30 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 md:py-24 w-full">
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 md:slide-in-from-left-12 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-[10px] md:text-sm font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-300" />
            <span>Next-Generation Healthcare Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1] md:leading-[0.95] tracking-tighter">
            Digital Records. <br />
            <span className="text-blue-300">Human Connection.</span>
          </h1>

          <p className="text-base md:text-xl text-blue-100/80 max-w-lg leading-relaxed font-medium">
            MediPortal bridges the critical gap between patients and responders with high-fidelity records and instant clinical triage technology.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-300" />
              </div>
              <h4 className="font-bold text-white text-base md:text-lg">Encrypted Vault</h4>
              <p className="text-xs md:text-sm text-blue-200/60 leading-relaxed">Sovereign control over your entire clinical history.</p>
            </div>
            <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white text-base md:text-lg">Health Insights</h4>
              <p className="text-xs md:text-sm text-blue-200/60 leading-relaxed">AI-powered symptom analysis and facility management.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center animate-in fade-in slide-in-from-right-4 md:slide-in-from-right-12 duration-1000 w-full lg:w-auto">
          <div className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-white/20">
            <div className="flex gap-2 md:gap-4 mb-8 md:mb-10 p-1.5 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 md:py-3 text-[10px] md:text-sm font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-royal-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 md:py-3 text-[10px] md:text-sm font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-royal-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Join
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {!isLogin && (
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity Type</label>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.PATIENT)}
                      className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-2xl border-2 transition-all ${role === UserRole.PATIENT ? 'border-royal-blue bg-blue-50 text-royal-blue' : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.DOCTOR)}
                      className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-2xl border-2 transition-all ${role === UserRole.DOCTOR ? 'border-royal-blue bg-blue-50 text-royal-blue' : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}
                    >
                      Staff
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1 md:space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-100 focus:border-royal-blue outline-none transition-all font-semibold text-sm md:text-base text-slate-900"
                    placeholder="Enter full name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-1 md:space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Terminal</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-100 focus:border-royal-blue outline-none transition-all font-semibold text-sm md:text-base text-slate-900"
                  placeholder="name@organization.com"
                  required
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-100 focus:border-royal-blue outline-none transition-all font-semibold text-sm md:text-base text-slate-900"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold px-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-blue text-white py-4 md:py-6 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all shadow-xl shadow-blue-900/20 mt-4 disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Establish Connection' : 'Register Profile'}
                {!loading && <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            </form>

            <div className="mt-8 md:mt-10 text-center">
              <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                <Activity className="w-2.5 h-2.5 md:w-3 md:h-3" /> HIPAA-Compliant Encryption Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
