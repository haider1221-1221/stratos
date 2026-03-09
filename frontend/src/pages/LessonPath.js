import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Lock, Check, Star, BookOpen, Layers, Zap, Flame
} from 'lucide-react';

const LANGUAGES = {
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pt: { name: 'Portuguese', flag: '🇧🇷' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
};

const LessonPath = () => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const langInfo = LANGUAGES[language] || { name: 'Language', flag: '🌍' };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get(`${API_URL}/lessons/${language}`);
        setLessons(response.data);
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [language]);

  const handleStartLesson = (lesson) => {
    if (lesson.locked) {
      toast.error('Complete the previous lesson first!');
      return;
    }
    navigate(`/lesson/${language}/${lesson.id}`);
  };

  const currentLessonIndex = lessons.findIndex(l => !l.completed && !l.locked);
  const completedCount = lessons.filter(l => l.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{langInfo.flag}</span>
              <div>
                <span className="font-heading font-bold text-xl text-slate-800 block">{langInfo.name}</span>
                {lessons.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">{completedCount} / {lessons.length} lessons done</span>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/flashcards/${language}`}
            className="stratos-btn-secondary flex items-center gap-2 text-sm py-2.5"
            data-testid="flashcards-link"
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards</span>
          </Link>
        </div>

        {/* Progress bar */}
        {lessons.length > 0 && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all"
              style={{ width: `${(completedCount / lessons.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="stratos-card text-center py-14">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-sky-400" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
              Coming Soon!
            </h2>
            <p className="text-slate-500 mb-6">
              Lessons for {langInfo.name} are being prepared. Check back soon!
            </p>
            <Link to="/languages" className="stratos-btn-primary inline-block">
              Try Another Language
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical path line */}
            <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-sky-200 via-indigo-200 to-sky-200 -translate-x-1/2 z-0 rounded-full" />

            <div className="relative z-10 space-y-6">
              {lessons.map((lesson, index) => {
                const isCompleted = lesson.completed;
                const isCurrent = index === currentLessonIndex;
                const isLocked = lesson.locked;
                const isLeft = index % 2 === 0;

                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Lesson Card */}
                    <button
                      onClick={() => handleStartLesson(lesson)}
                      disabled={isLocked}
                      className={`flex-1 text-left rounded-3xl border-2 p-5 transition-all ${isLocked
                          ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                          : isCurrent
                            ? 'bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ring-2 ring-sky-300 ring-offset-1'
                            : isCompleted
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:-translate-y-1 hover:shadow-md cursor-pointer'
                              : 'bg-white border-slate-200 hover:border-sky-300 hover:-translate-y-1 hover:shadow-md cursor-pointer'
                        }`}
                      data-testid={`lesson-${lesson.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md shadow-green-200'
                            : isCurrent
                              ? 'bg-gradient-to-br from-sky-400 to-indigo-500 shadow-md shadow-sky-200 animate-pulse-glow'
                              : 'bg-slate-200'
                          }`}>
                          {isCompleted ? (
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-slate-400" />
                          ) : (
                            <Star className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-base text-slate-800 mb-0.5">
                            {lesson.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{lesson.description}</p>
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-yellow-600 font-bold">
                              <Zap className="w-3.5 h-3.5" /> +{lesson.xp_reward} XP
                            </span>
                            {isCompleted && lesson.score > 0 && (
                              <span className="text-green-600 font-bold">Score: {lesson.score}%</span>
                            )}
                            {isCurrent && (
                              <span className="text-sky-600 font-bold bg-sky-100 px-2 py-0.5 rounded-full text-xs">▶ Current</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Node on path */}
                    <div className={`w-8 h-8 rounded-full border-4 flex-shrink-0 transition-all ${isCompleted
                        ? 'bg-green-500 border-green-300 shadow-md shadow-green-200'
                        : isCurrent
                          ? 'bg-sky-500 border-sky-300 shadow-md shadow-sky-200 animate-pulse'
                          : 'bg-slate-200 border-slate-100'
                      }`} />

                    {/* Spacer */}
                    <div className="flex-1" />
                  </div>
                );
              })}
            </div>

            {/* End trophy */}
            <div className="flex justify-center mt-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-200 mx-auto">
                  <span className="text-4xl">🏆</span>
                </div>
                <p className="mt-2 text-slate-400 text-sm font-medium">Course Complete!</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonPath;
