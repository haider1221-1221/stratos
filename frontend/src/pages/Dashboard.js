import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import {
  Flame, Zap, Heart, Globe, Trophy, BookOpen,
  LogOut, ChevronRight, Star, Target, Layers, TrendingUp, Award,
  Sparkles, ShoppingBag, Shield, Users
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const langRes = await axios.get(`${API_URL}/languages`);
        setLanguages(langRes.data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const currentLanguage = user?.current_language;
  if (!Array.isArray(languages) && languages) {
    console.warn('Unexpected languages response (expected array):', languages);
  }
  const learningLanguages = Array.isArray(languages)
    ? languages.filter(l => user?.languages_learning?.includes(l.code))
    : [];

  // Calculate level progress
  const xpForCurrentLevel = ((user?.level || 1) - 1) * 100;
  const xpForNextLevel = (user?.level || 1) * 100;
  const levelProgress = ((user?.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100;
  const clampedLevelProgress = Math.max(0, Math.min(100, levelProgress));

  // SVG ring for level progress
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (clampedLevelProgress / 100) * ringCircumference;

  const navStats = [
    { key: 'streak', icon: <Flame className="w-5 h-5" />, value: user?.streak || 0, label: 'Streak', className: 'streak-fire' },
    { key: 'xp', icon: <Zap className="w-5 h-5" />, value: user?.xp || 0, label: 'XP', className: 'xp-zap' },
    { key: 'gems', icon: <Sparkles className="w-5 h-5" />, value: user?.gems || 0, label: 'Gems', className: 'text-indigo-500 font-bold' },
    { key: 'hearts', icon: <Heart className="w-5 h-5 fill-current" />, value: user?.hearts || 0, label: 'Lives', className: 'hearts-display' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-800">Stratos</span>
          </Link>

          {/* Stats with hover tooltips */}
          <div className="flex items-center gap-5">
            {navStats.map(stat => (
              <div
                key={stat.key}
                className="relative flex items-center gap-1.5 cursor-default"
                onMouseEnter={() => setTooltip(stat.key)}
                onMouseLeave={() => setTooltip(null)}
                data-testid={`user-${stat.key}`}
              >
                <span className={stat.className}>{stat.icon}</span>
                <span className="font-heading font-bold text-base text-slate-700">{stat.value}</span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">{stat.label}</span>
                {tooltip === stat.key && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    {stat.label}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                )}
              </div>
            ))}

            {/* Profile menu */}
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors"
                data-testid="nav-profile-link"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section — reduced headline, stronger CTA hierarchy */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-0.5">Welcome back</p>
            <h1 className="font-heading font-bold text-xl text-slate-800">
              {user?.name?.split(' ')[0] || 'Learner'} 👋
            </h1>
          </div>
          {learningLanguages.length > 0 && (
            <Link
              to={`/learn/${learningLanguages[0]?.code}`}
              className="stratos-btn-primary flex items-center gap-2 text-sm px-6 py-3"
              data-testid="resume-lesson-btn"
            >
              Resume Lesson <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Language Card — highlighted primary card */}
            {currentLanguage && learningLanguages.length > 0 ? (
              <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 shadow-[0_8px_30px_rgba(14,165,233,0.12)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading font-bold text-lg text-slate-700">Continue Learning</h2>
                  <Link
                    to="/languages"
                    className="text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1 text-sm"
                  >
                    All Languages <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {learningLanguages.slice(0, 2).map(lang => (
                    <Link
                      key={lang.code}
                      to={`/learn/${lang.code}`}
                      className="group bg-white rounded-2xl border-2 border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-5 flex items-center gap-4"
                      data-testid={`continue-${lang.code}`}
                    >
                      <span className="text-5xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-lg text-slate-800">{lang.name}</div>
                        <div className="text-sm text-slate-500 mb-2">{lang.lessons_count} lessons</div>
                        <div className="h-2.5 bg-sky-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${lang.progress || 0}%` }}
                          />
                        </div>
                        <div className="text-xs text-sky-600 font-semibold mt-1">{lang.progress || 0}% complete</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="stratos-card text-center py-12">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-10 h-10 text-sky-500" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
                  Start Your Journey
                </h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Choose a language to begin your learning adventure!
                </p>
                <Link
                  to="/languages"
                  className="stratos-btn-primary inline-flex items-center gap-2"
                  data-testid="choose-language-btn"
                >
                  Choose a Language
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                to="/languages"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center"
                data-testid="quick-languages"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                  <Layers className="w-7 h-7 text-indigo-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Languages</span>
                <span className="text-sm text-slate-500">Browse all</span>
              </Link>

              <Link
                to="/leaderboard"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center"
                data-testid="quick-leaderboard"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-3">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Leaderboard</span>
                <span className="text-sm text-slate-500">See rankings</span>
              </Link>

              <Link
                to="/shop"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center border-indigo-100 bg-indigo-50/30"
                data-testid="quick-shop"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7 text-indigo-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Shop</span>
                <span className="text-sm text-slate-500">Get boosters</span>
              </Link>
            </div>
          </div>

          {/* Right Column — Unified Profile Progress + Streak */}
          <div className="space-y-5">
            {/* Unified Profile Progress Card */}
            <div className="stratos-card">
              <h3 className="font-heading font-bold text-base text-slate-700 mb-4">Profile Progress</h3>

              {/* Level Ring + XP*/}
              <div className="flex items-center gap-4 mb-5">
                {/* SVG Ring */}
                <div className="relative flex-shrink-0 w-[80px] h-[80px]">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={ringRadius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r={ringRadius}
                      fill="none"
                      stroke="url(#levelGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <defs>
                      <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading font-extrabold text-xl text-slate-800 leading-none">{user?.level || 1}</span>
                    <span className="text-[10px] text-slate-400 font-medium">LVL</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-heading font-bold text-slate-800 flex items-center gap-2">
                    Level {user?.level || 1}
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-extrabold rounded-md uppercase tracking-wide">
                      {user?.league || 'Bronze'} League
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-500">{user?.xp || 0} XP</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {Math.round(clampedLevelProgress)}% to Level {(user?.level || 1) + 1}
                  </div>
                </div>
              </div>

              {/* Hearts (demoted, minimal) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                  <span className="text-sm text-slate-500 font-medium">Lives</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-4 h-4 ${i < (user?.hearts || 0) ? 'text-red-400 fill-red-400' : 'text-slate-200 fill-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              {/* Active Boosters */}
              {user?.active_boosters?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Boosters</h4>
                  <div className="space-y-2">
                    {user.active_boosters.map((boost, i) => (
                      <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between animate-pulse-subtle">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Zap className="w-4 h-4 fill-current" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-700">XP Double</p>
                            <p className="text-[9px] text-indigo-400 font-bold uppercase">{boost.uses_left} lessons left</p>
                          </div>
                        </div>
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Link to Friends */}
            <Link
              to="/friends"
              className="block group bg-white border-2 border-slate-100 hover:border-indigo-100 rounded-3xl p-5 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-slate-800 text-sm">Friends Squad</p>
                    <p className="text-xs text-slate-400">{user?.friends?.length || 0} friends connected</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Streak Card — prominent */}
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_8px_30px_rgba(249,115,22,0.25)] p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Flame className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="font-heading font-extrabold text-4xl text-white leading-none">{user?.streak || 0}</div>
                  <div className="text-orange-100 font-semibold text-sm mt-0.5">Day Streak 🔥</div>
                </div>
              </div>
              <p className="mt-4 text-orange-100 text-sm leading-relaxed">
                {user?.streak > 0
                  ? "You're on fire! Practice today to keep it going."
                  : "Start your streak by completing a lesson today!"
                }
              </p>
              {user?.streak > 0 && (
                <div className="mt-3 flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full ${i < Math.min(user.streak % 7 || 7, 7)
                        ? 'bg-white'
                        : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
