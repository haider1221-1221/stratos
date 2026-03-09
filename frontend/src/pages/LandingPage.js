import { Link } from 'react-router-dom';
import { Flame, Zap, Heart, Globe, Trophy, BookOpen, Sparkles, ChevronRight, Star, Users, Shield } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-200">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Stratos</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="px-5 py-2 text-slate-600 font-semibold hover:text-sky-600 transition-colors text-sm"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              data-testid="nav-signup-btn"
              className="stratos-btn-primary text-sm py-2.5 px-6"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-transparent pointer-events-none" />
        <div className="absolute top-28 left-0 w-[500px] h-[500px] bg-sky-200 rounded-full blur-[100px] opacity-30 pointer-events-none" />
        <div className="absolute top-48 right-0 w-[600px] h-[600px] bg-indigo-200 rounded-full blur-[100px] opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-slate-100">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-slate-600 text-sm">Learn 10+ languages for free</span>
              </div>

              <h1 className="font-heading font-extrabold text-5xl lg:text-6xl xl:text-[72px] text-slate-800 leading-[1.1]">
                Elevate Your
                <span className="block bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  Language Skills
                </span>
              </h1>

              <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                Join millions of learners worldwide. Master new languages through fun,
                bite-sized lessons, flashcards, and interactive quizzes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  data-testid="hero-get-started-btn"
                  className="stratos-btn-primary text-lg flex items-center gap-2"
                >
                  Start Learning Free
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  data-testid="hero-login-btn"
                  className="stratos-btn-secondary text-lg"
                >
                  I have an account
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-10 pt-2">
                {[
                  { value: '10+', label: 'Languages' },
                  { value: '500K+', label: 'Learners' },
                  { value: '50M+', label: 'Lessons Done' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="font-heading font-extrabold text-3xl bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">{s.value}</div>
                    <div className="text-slate-500 font-medium text-sm mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right content - Hero visual */}
            <div className="relative">
              {/* Main card */}
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800">Daily Lesson</div>
                    <div className="text-slate-400 text-sm">Spanish • Beginner</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-orange-500">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">7</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 mb-4">
                  <p className="text-slate-400 text-sm mb-2">Translate this sentence:</p>
                  <p className="font-heading font-bold text-2xl text-slate-800">"Good morning!"</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Buenos días', 'Buenas noches', 'Hola amigo', 'Buen provecho'].map((opt, i) => (
                    <div key={i} className={`p-3 rounded-xl border-2 text-center font-semibold text-sm cursor-pointer transition-all ${i === 0 ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-sky-300'
                      }`}>
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
                  </div>
                  <span className="text-sm font-bold text-slate-500">65%</span>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-6 top-16 bg-white rounded-2xl p-4 shadow-xl animate-float z-20 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800 text-sm">7 Day Streak!</div>
                    <div className="text-xs text-slate-400">Keep it going!</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 bottom-24 bg-white rounded-2xl p-4 shadow-xl animate-float z-20 border border-slate-100" style={{ animationDelay: '1.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800 text-sm">+150 XP Earned</div>
                    <div className="text-xs text-slate-400">Lesson complete!</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 top-8 bg-white rounded-2xl p-3 shadow-lg animate-float z-20 border border-slate-100" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-slate-700 text-sm">Achievement Unlocked!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-indigo-600 font-semibold text-sm">Why Stratos?</span>
            </div>
            <h2 className="font-heading font-extrabold text-4xl text-slate-800 mb-4">
              Learning Made Fun & Effective
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Our science-backed approach with gamification keeps you motivated and coming back every day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Interactive Lessons', desc: 'Learn through writing, listening, and speaking exercises', colorFrom: '#38bdf8', colorTo: '#6366f1', bg: '#eff6ff' },
              { icon: Flame, title: 'Daily Streaks', desc: 'Build habits with streak tracking and daily reminders', colorFrom: '#f97316', colorTo: '#ef4444', bg: '#fff7ed' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete with learners worldwide and climb the ranks', colorFrom: '#eab308', colorTo: '#f97316', bg: '#fefce8' },
              { icon: Shield, title: 'Hearts System', desc: 'Learn from mistakes without losing your progress', colorFrom: '#ec4899', colorTo: '#ef4444', bg: '#fff1f2' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-3xl border-2 border-slate-100 p-6 hover:border-sky-200 hover:-translate-y-2 hover:shadow-xl transition-all cursor-default"
                style={{ background: feature.bg }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${feature.colorFrom}, ${feature.colorTo})` }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading font-extrabold text-4xl text-slate-800 mb-4">
              Choose Your Language
            </h2>
            <p className="text-xl text-slate-400">
              Start learning any of our 10+ languages today — completely free
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { flag: '🇪🇸', name: 'Spanish', tag: '🔥 Most Popular' },
              { flag: '🇫🇷', name: 'French', tag: null },
              { flag: '🇩🇪', name: 'German', tag: null },
              { flag: '🇯🇵', name: 'Japanese', tag: '⭐ Trending' },
              { flag: '🇨🇳', name: 'Chinese', tag: null },
              { flag: '🇮🇹', name: 'Italian', tag: null },
              { flag: '🇧🇷', name: 'Portuguese', tag: null },
              { flag: '🇰🇷', name: 'Korean', tag: '⭐ Trending' },
              { flag: '🇷🇺', name: 'Russian', tag: null },
              { flag: '🇸🇦', name: 'Arabic', tag: null },
            ].map((lang, i) => (
              <Link
                key={i}
                to="/signup"
                className="group bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border-2 border-slate-100 hover:border-sky-300 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                <div>
                  <span className="font-heading font-bold text-slate-800 block">{lang.name}</span>
                  {lang.tag && <span className="text-xs text-sky-600 font-semibold">{lang.tag}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-4xl text-slate-800 mb-3">Loved by Learners</h2>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-slate-400">Rated 4.9/5 by over 500,000 learners</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Maria S.', lang: 'Spanish', text: 'I went from zero to conversational in 3 months. The streaks really keep you accountable!', avatar: 'M' },
              { name: 'James K.', lang: 'Japanese', text: 'Best language app I\'ve used. The XP system makes learning feel like a game you never want to stop.', avatar: 'J' },
              { name: 'Priya N.', lang: 'French', text: 'The leaderboard is addictive! I\'ve maintained a 60-day streak just to stay ahead of my friends.', avatar: 'P' },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs">Learning {t.lang}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">Join 500,000+ learners today</span>
          </div>
          <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-white mb-5 leading-tight">
            Ready to Start Your<br />Language Journey?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join the Stratos community today — free forever, no credit card needed.
          </p>
          <Link
            to="/signup"
            data-testid="cta-signup-btn"
            className="inline-flex items-center gap-2 bg-white text-sky-600 font-extrabold text-lg px-10 py-5 rounded-2xl hover:bg-sky-50 transition-all shadow-2xl hover:-translate-y-1"
          >
            Get Started for Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-extrabold text-2xl text-white">Stratos</span>
            </div>
            <div className="flex items-center gap-8 text-slate-400 text-sm">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </div>
            <div className="text-slate-500 text-sm">© 2025 Stratos. Elevate Your Language Skills.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
