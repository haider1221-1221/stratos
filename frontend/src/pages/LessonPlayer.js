import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import {
  X, Volume2, Check, ChevronRight, Zap, Flame, Trophy, Heart
} from 'lucide-react';

/**
 * Normalize an answer for comparison:
 *  - lowercase
 *  - replace all punctuation/separators (commas, periods, hyphens, slashes, etc.) with a space
 *  - collapse multiple spaces into one
 *  - trim leading/trailing whitespace
 * This lets "uno,dos,tres" or "uno, dos, tres" correctly match "uno dos tres".
 */
const normalizeAnswer = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics/accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()''"\[\]]/g, '') // strip punctuation
    .replace(/\s+/g, '') // remove ALL spaces for keyboard tolerance
    .trim();

const LessonPlayer = () => {
  const { language, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`${API_URL}/lessons/${language}/${lessonId}`);
        setLesson(response.data);
        setSessionToken(response.data.session_token || null);
        setAnswers(new Array(response.data.content.length).fill(''));
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
        toast.error('Failed to load lesson');
        navigate(`/learn/${language}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [language, lessonId, navigate]);

  const currentQuestion = lesson?.content?.[currentIndex];
  const progress = lesson ? ((currentIndex) / lesson.content.length) * 100 : 0;
  const isLastQuestion = currentIndex === (lesson?.content?.length || 0) - 1;

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window) {
      const text = currentQuestion?.correct_answer || '';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' :
        language === 'fr' ? 'fr-FR' :
          language === 'de' ? 'de-DE' :
            language === 'ja' ? 'ja-JP' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const checkAnswer = () => {
    let userAnswer;
    let storedAnswer;

    if (currentQuestion?.type === 'written' || currentQuestion?.type === 'voice') {
      // Normalize typed input: strip punctuation & extra spaces so
      // "uno,dos,tres" == "uno dos tres" == "uno, dos, tres"
      userAnswer = normalizeAnswer(writtenAnswer);
      storedAnswer = userAnswer;
    } else {
      // Multiple choice — compare normalized so special chars don't trip it
      userAnswer = normalizeAnswer(selectedOption);
      storedAnswer = selectedOption; // keep original for display
    }

    const correctAnswer = normalizeAnswer(currentQuestion?.correct_answer);
    const correct = userAnswer === correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = [...answers];
    // Store raw answer for submission; backend will also normalize
    newAnswers[currentIndex] = currentQuestion?.type === 'written' || currentQuestion?.type === 'voice'
      ? writtenAnswer
      : (selectedOption || '');
    setAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      setSubmitting(true);
      try {
        const response = await axios.post(`${API_URL}/lessons/${language}/${lessonId}/complete`, {
          lesson_id: lessonId,
          answers: answers,
          session_token: sessionToken,
        });
        setResult(response.data);
        await refreshUser();
      } catch (error) {
        console.error('Failed to submit lesson:', error);
        toast.error('Failed to complete lesson');
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setWrittenAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      navigate(`/learn/${language}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Trophy / retry */}
          <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl ${result.passed
            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-amber-200'
            : 'bg-gradient-to-br from-orange-400 to-red-500 shadow-red-200'
            }`}>
            {result.passed ? (
              <Trophy className="w-14 h-14 text-white" />
            ) : (
              <span className="text-5xl">💪</span>
            )}
          </div>

          <div className="text-center mb-6">
            <h1 className="font-heading font-extrabold text-3xl text-slate-800 mb-2">
              {result.passed ? 'Lesson Complete! 🎉' : 'Keep Practicing!'}
            </h1>
            <p className="text-slate-400">
              {result.passed
                ? "Great job! You've mastered this lesson."
                : 'You need 70% to pass. Try again!'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-5 text-center shadow-sm">
              <div className="font-heading font-extrabold text-3xl text-slate-800 mb-1">{result.correct}/{result.total}</div>
              <div className="text-sm text-slate-400 font-medium">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl border-2 border-yellow-200 p-5 text-center shadow-sm">
              <div className="font-heading font-extrabold text-3xl text-yellow-600 flex items-center justify-center gap-1 mb-1">
                <Zap className="w-6 h-6" />
                {result.xp_earned}
              </div>
              <div className="text-sm text-yellow-600 font-medium">XP Earned</div>
            </div>
          </div>

          {result.streak_bonus > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl border-2 border-orange-200 p-4 mb-4 flex items-center justify-center gap-2 text-orange-600">
              <Flame className="w-5 h-5" />
              <span className="font-bold">+{result.streak_bonus} Streak Bonus!</span>
            </div>
          )}

          {result.new_level && (
            <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-3xl border-2 border-indigo-200 p-4 mb-4 text-center">
              <div className="font-heading font-bold text-xl text-indigo-600">
                🎉 Level Up! You're now Level {result.new_level}!
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Link
              to={`/learn/${language}`}
              className="flex-1 stratos-btn-secondary text-center"
              data-testid="back-to-lessons"
            >
              Back to Lessons
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 stratos-btn-primary text-center"
              data-testid="go-dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={handleExit}
            className="text-slate-400 hover:text-red-400 transition-colors"
            data-testid="exit-lesson-btn"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 relative">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1 text-right">
              {currentIndex + 1} / {lesson?.content?.length}
            </div>
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1.5 text-red-400">
            <Heart className="w-5 h-5 fill-red-400" />
            <span className="font-bold text-sm">{user?.hearts || 0}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {/* Question type badge */}
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              {currentQuestion?.type === 'multiple_choice' ? '🎯 Multiple Choice' :
                currentQuestion?.type === 'voice' ? '🔊 Listen & Type' : '✏️ Written Answer'}
            </span>
          </div>

          {/* Question */}
          <div className="mb-8">
            {currentQuestion?.type === 'voice' && (
              <button
                onClick={handlePlayVoice}
                className="w-24 h-24 bg-gradient-to-br from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-200"
                data-testid="play-voice-btn"
              >
                <Volume2 className="w-12 h-12 text-white" />
              </button>
            )}

            <h2 className="font-heading font-bold text-2xl text-slate-800 text-center mb-2 leading-tight">
              {currentQuestion?.question}
            </h2>

            {currentQuestion?.hint && !showResult && (
              <p className="text-slate-400 text-center text-sm mt-2 bg-slate-100 rounded-xl px-4 py-2 inline-block w-full">
                💡 Hint: {currentQuestion.hint}
              </p>
            )}
          </div>

          {/* Multiple choice options */}
          {currentQuestion?.type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = selectedOption === option;
                const isAnswer = option === currentQuestion.correct_answer;
                const showCorrect = showResult && isAnswer;
                const showWrong = showResult && isSelected && !isAnswer;

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedOption(option)}
                    disabled={showResult}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${showCorrect ? 'bg-green-50 border-green-400 shadow-md' :
                      showWrong ? 'bg-red-50 border-red-400' :
                        isSelected ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200' :
                          'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                      }`}
                    data-testid={`option-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${showCorrect ? 'bg-green-500 text-white' :
                        showWrong ? 'bg-red-400 text-white' :
                          isSelected ? 'bg-sky-500 text-white' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={`font-medium ${showCorrect ? 'text-green-700' :
                        showWrong ? 'text-red-600' :
                          'text-slate-700'
                        }`}>{option}</span>
                      {showCorrect && <Check className="w-5 h-5 text-green-500 ml-auto" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Written / Voice input */}
          {(currentQuestion?.type === 'written' || currentQuestion?.type === 'voice') && (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={showResult}
                className={`stratos-input text-center text-xl ${showResult && isCorrect ? 'border-green-400 bg-green-50 ring-4 ring-green-100' :
                  showResult && !isCorrect ? 'border-red-400 bg-red-50' : ''
                  }`}
                data-testid="written-answer-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && writtenAnswer && !showResult) checkAnswer();
                }}
              />

              {showResult && !isCorrect && (
                <div className="mt-3 text-center bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3">
                  <p className="text-green-700 font-semibold text-sm">
                    ✅ Correct answer: <span className="font-extrabold">{currentQuestion.correct_answer}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Result feedback inline */}
          {showResult && (
            <div className={`mt-6 mb-2 rounded-2xl px-5 py-3 border flex items-center gap-3 transition-all ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}>
                {isCorrect
                  ? <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  : <X className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {isCorrect ? 'Excellent! ✨' : 'Not quite right'}
                </p>
                {!isCorrect && (
                  <p className="opacity-90 text-xs">
                    Correct answer: <span className="font-extrabold underline">{currentQuestion?.correct_answer}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4">
            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={!selectedOption && !writtenAnswer}
                className="stratos-btn-primary w-full text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="check-answer-btn"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={submitting}
                className={`w-full text-lg font-extrabold rounded-2xl border-b-4 px-8 py-4 transition-all flex items-center justify-center gap-2 ${isCorrect
                  ? 'bg-green-500 hover:bg-green-400 text-white border-green-700 shadow-lg shadow-green-200'
                  : 'bg-orange-500 hover:bg-orange-400 text-white border-orange-700 shadow-lg shadow-orange-200'
                  }`}
                data-testid="continue-btn"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {isLastQuestion ? 'Complete Lesson' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonPlayer;
