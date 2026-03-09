import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { Globe, ArrowLeft, ChevronRight, Check, BookOpen, Flame, Star, Briefcase } from 'lucide-react';

const LANGUAGE_TAGS = {
  es: { label: '🔥 Popular', color: 'bg-orange-100 text-orange-600' },
  fr: { label: '⭐ Beginner Friendly', color: 'bg-blue-100 text-blue-600' },
  ja: { label: '💼 Business', color: 'bg-purple-100 text-purple-600' },
  de: { label: '⭐ Beginner Friendly', color: 'bg-blue-100 text-blue-600' },
  zh: { label: '🔥 Popular', color: 'bg-orange-100 text-orange-600' },
  pt: { label: '🔥 Popular', color: 'bg-orange-100 text-orange-600' },
};

const LanguageSelect = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_URL}/languages`);
        setLanguages(response.data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleSelectLanguage = async (langCode) => {
    setSelecting(langCode);
    try {
      await axios.post(`${API_URL}/languages/${langCode}/start`);
      await refreshUser();
      toast.success("Language selected! Let's start learning!");
      navigate(`/learn/${langCode}`);
    } catch (error) {
      console.error('Failed to select language:', error);
      toast.error('Failed to select language');
    } finally {
      setSelecting(null);
    }
  };

  const isLearning = (code) => user?.languages_learning?.includes(code);

  const learningLanguages = Array.isArray(languages)
    ? languages.filter(l => isLearning(l.code))
    : [];
  const otherLanguages = Array.isArray(languages)
    ? languages.filter(l => !isLearning(l.code))
    : [];

  const visibleOthers = showAll ? otherLanguages : otherLanguages.slice(0, 6);

  const LanguageCard = ({ lang }) => {
    const learning = isLearning(lang.code);
    const tag = LANGUAGE_TAGS[lang.code];
    return (
      <button
        key={lang.code}
        onClick={() => handleSelectLanguage(lang.code)}
        disabled={selecting !== null}
        className={`relative overflow-hidden group text-left p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${learning
            ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-200 ring-offset-1'
            : 'border-slate-200 bg-white hover:border-sky-300'
          }`}
        data-testid={`select-language-${lang.code}`}
      >
        {/* Selected checkmark — top right, strong contrast */}
        {learning && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Tag */}
        {tag && (
          <div className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${tag.color}`}>
            {tag.label}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl group-hover:scale-110 transition-transform">{lang.flag}</span>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-800">{lang.name}</h3>
            <p className="text-slate-500 text-sm">{lang.lessons_count} lessons</p>
          </div>
        </div>

        {learning && lang.progress > 0 && (
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Progress</span>
              <span className="font-bold text-sky-600">{lang.progress}%</span>
            </div>
            <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
                style={{ width: `${lang.progress}%` }}
              />
            </div>
          </div>
        )}

        {selecting === lang.code && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-3xl">
            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className={`font-bold text-sm px-4 py-2 rounded-xl ${learning
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 text-slate-600 group-hover:bg-sky-500 group-hover:text-white transition-colors'
            }`}>
            {learning ? 'Resume' : 'Start'}
          </span>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-800">Choose a Language</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="font-heading font-extrabold text-3xl text-slate-800 mb-2">What do you want to learn?</h1>
          <p className="text-slate-500">Choose a language and start your journey to fluency</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section: Continue Learning */}
            {learningLanguages.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-sky-500 rounded-full" />
                  <h2 className="font-heading font-bold text-base text-slate-700 uppercase tracking-wide">Continue Learning</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {learningLanguages.map(lang => <LanguageCard key={lang.code} lang={lang} />)}
                </div>
              </section>
            )}

            {/* Section: All Languages (or Recommended) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                <h2 className="font-heading font-bold text-base text-slate-700 uppercase tracking-wide">
                  {learningLanguages.length > 0 ? 'All Languages' : 'Recommended'}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleOthers.map(lang => <LanguageCard key={lang.code} lang={lang} />)}
              </div>

              {/* Show More / Less toggle */}
              {otherLanguages.length > 6 && (
                <div className="mt-5 text-center">
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="stratos-btn-secondary text-sm px-6 py-2.5"
                  >
                    {showAll ? 'Show Less ▲' : `View All (${otherLanguages.length}) ▼`}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-10 stratos-card bg-gradient-to-br from-indigo-50 to-sky-50 border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-800 mb-1">Learn Multiple Languages</h3>
              <p className="text-slate-600">
                You can learn as many languages as you want! Switch between them anytime from the dashboard.
                Earn the Polyglot badge by learning 3 or more languages.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LanguageSelect;
