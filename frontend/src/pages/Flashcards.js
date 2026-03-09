import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, RotateCcw, Volume2, ChevronLeft, ChevronRight, Check, ThumbsDown
} from 'lucide-react';

const LANGUAGES = {
  es: { name: 'Spanish', flag: '🇪🇸', color: 'from-red-500 to-yellow-500' },
  fr: { name: 'French', flag: '🇫🇷', color: 'from-blue-500 to-red-500' },
  de: { name: 'German', flag: '🇩🇪', color: 'from-slate-800 to-red-500' },
  ja: { name: 'Japanese', flag: '🇯🇵', color: 'from-red-600 to-pink-500' },
  zh: { name: 'Chinese', flag: '🇨🇳', color: 'from-red-600 to-yellow-500' },
  it: { name: 'Italian', flag: '🇮🇹', color: 'from-green-500 to-red-500' },
  pt: { name: 'Portuguese', flag: '🇧🇷', color: 'from-green-500 to-yellow-400' },
  ko: { name: 'Korean', flag: '🇰🇷', color: 'from-blue-600 to-red-500' },
  ru: { name: 'Russian', flag: '🇷🇺', color: 'from-blue-600 to-red-500' },
  ar: { name: 'Arabic', flag: '🇸🇦', color: 'from-green-600 to-white' },
};

const Flashcards = () => {
  const { language } = useParams();
  const { user } = useAuth();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState([]);
  const [unknownCards, setUnknownCards] = useState([]);

  const langInfo = LANGUAGES[language] || { name: 'Language', flag: '🌍', color: 'from-sky-400 to-indigo-500' };

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await axios.get(`${API_URL}/flashcards/${language}`);
        setSets(response.data);
      } catch (error) {
        console.error('Failed to fetch flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [language]);

  const currentCard = currentSet?.cards?.[currentCardIndex];
  const totalCards = currentSet?.cards?.length || 0;
  const progress = totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleKnown = () => {
    if (!knownCards.includes(currentCardIndex)) {
      setKnownCards([...knownCards, currentCardIndex]);
      setUnknownCards(unknownCards.filter(i => i !== currentCardIndex));
    }
    handleNext();
  };

  const handleUnknown = () => {
    if (!unknownCards.includes(currentCardIndex)) {
      setUnknownCards([...unknownCards, currentCardIndex]);
      setKnownCards(knownCards.filter(i => i !== currentCardIndex));
    }
    handleNext();
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
    setUnknownCards([]);
  };

  const handleSelectSet = (set) => {
    if (set.locked) {
      toast.error('Complete the corresponding lesson to unlock these flashcards!');
      return;
    }
    setCurrentSet(set);
    handleReset();
  };

  const handleBackToSets = () => {
    setCurrentSet(null);
    handleReset();
  };

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window && currentCard) {
      const utterance = new SpeechSynthesisUtterance(currentCard.back);
      utterance.lang = language === 'es' ? 'es-ES' :
        language === 'fr' ? 'fr-FR' :
          language === 'de' ? 'de-DE' :
            language === 'ja' ? 'ja-JP' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const isKnown = knownCards.includes(currentCardIndex);
  const isUnknown = unknownCards.includes(currentCardIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentSet ? (
              <button
                onClick={handleBackToSets}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <Link
                to={`/learn/${language}`}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
            )}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{langInfo.flag}</span>
              <div>
                <span className="font-heading font-bold text-lg text-slate-800 block">Flashcards</span>
                <span className="text-slate-400 text-xs">{currentSet ? currentSet.title : `Choose a topic in ${langInfo.name}`}</span>
              </div>
            </div>
          </div>

          {currentSet && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 bg-green-100 text-green-600 font-bold px-3 py-1 rounded-full">
                  ✓ {knownCards.length}
                </span>
                <span className="flex items-center gap-1 bg-red-100 text-red-500 font-bold px-3 py-1 rounded-full">
                  ✗ {unknownCards.length}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="stratos-btn-secondary flex items-center gap-2 text-sm py-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {!currentSet ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">Practice Topics</h2>
              <p className="text-slate-500">Select a lesson to practice its vocabulary. Complete lessons in your path to unlock more flashcards!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sets.map((set) => (
                <div
                  key={set.id}
                  onClick={() => handleSelectSet(set)}
                  className={`stratos-card p-5 flex items-center justify-between cursor-pointer transition-all ${set.locked ? 'opacity-60 grayscale' : 'hover:border-sky-300 hover:shadow-md hover:-translate-y-1'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${set.locked ? 'bg-slate-100' : 'bg-sky-100'
                      }`}>
                      {set.locked ? '🔒' : '📖'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{set.title}</h3>
                      <p className="text-xs text-slate-400">{set.cards.length} cards</p>
                    </div>
                  </div>
                  {!set.locked && (
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : totalCards === 0 ? (
          <div className="stratos-card text-center py-14 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
              No Vocabulary Here
            </h2>
            <p className="text-slate-500 mb-6">
              This lesson doesn't have any specific vocabulary cards yet.
            </p>
            <button onClick={handleBackToSets} className="stratos-btn-primary inline-block">
              Back to Topics
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-medium">Card {currentCardIndex + 1} of {totalCards}</span>
                <span className="font-bold">
                  <span className="text-green-600">{knownCards.length} known</span>
                  <span className="text-slate-300 mx-2">•</span>
                  <span className="text-red-400">{unknownCards.length} still learning</span>
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Flashcard with 3D flip */}
            <div
              onClick={handleFlip}
              className="relative h-72 cursor-pointer mb-6"
              style={{ perspective: '1000px' }}
            >
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 rounded-3xl border-2 flex flex-col items-center justify-center p-8 shadow-xl ${isKnown ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' :
                    isUnknown ? 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50' :
                      'border-slate-200 bg-white'
                    }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {isKnown && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Term</p>
                  <h2 className="font-heading font-bold text-3xl text-slate-800 text-center leading-tight">
                    {currentCard?.front}
                  </h2>
                  <p className="text-slate-300 text-sm mt-6 flex items-center gap-2">
                    <span>👆</span> Tap to reveal translation
                  </p>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 rounded-3xl border-2 flex flex-col items-center justify-center p-8 shadow-xl bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200 ${isKnown ? 'border-green-300 from-green-50 to-emerald-50' : ''
                    }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isKnown ? 'text-green-600' : 'text-sky-600'}`}>
                    Translation
                  </p>
                  <h2 className="font-heading font-bold text-3xl text-slate-800 text-center leading-tight">
                    {currentCard?.back}
                  </h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayVoice(); }}
                    className="mt-6 w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-sky-200"
                  >
                    <Volume2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handlePrev}
                disabled={currentCardIndex === 0}
                className="stratos-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed p-3"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleUnknown}
                className="flex-1 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400 text-red-500 font-bold rounded-2xl py-3 flex items-center justify-center gap-2 transition-all"
              >
                <ThumbsDown className="w-5 h-5" />
                Still Learning
              </button>

              <button
                onClick={handleKnown}
                className="flex-1 bg-green-500 hover:bg-green-400 border-b-4 border-green-700 text-white font-extrabold rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:border-b-0 active:translate-y-1"
              >
                <Check className="w-5 h-5" strokeWidth={3} />
                I Know This!
              </button>

              <button
                onClick={handleNext}
                disabled={currentCardIndex === totalCards - 1}
                className="stratos-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed p-3"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-slate-300 text-xs font-medium">
              Tap card to flip • I Know This! removes card from focus
            </p>

            {/* Completion message */}
            {currentCardIndex === totalCards - 1 && knownCards.length + unknownCards.length === totalCards && (
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-3xl border-2 border-indigo-200 p-5 text-center transition-all animate-bounce-subtle">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-heading font-bold text-xl text-slate-800 mb-1">Session Complete!</h3>
                <p className="text-slate-500 text-sm">
                  <span className="text-green-600 font-bold">{knownCards.length}</span> known •{' '}
                  <span className="text-red-500 font-bold">{unknownCards.length}</span> to review
                </p>
                <div className="flex items-center gap-3 justify-center mt-4">
                  <button onClick={handleReset} className="stratos-btn-secondary text-sm px-6 py-2">
                    Restart
                  </button>
                  <button onClick={handleBackToSets} className="stratos-btn-primary text-sm px-6 py-2">
                    Back to Topics
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Flashcards;
