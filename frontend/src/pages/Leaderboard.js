import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import {
  ArrowLeft, Trophy, Medal, Flame, Zap, Crown, TrendingUp, TrendingDown, Minus,
  Users, Globe, Star, UserPlus, Check, X, Shield, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard = () => {
  const { user, refreshUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('league'); // 'global', 'league', 'friends'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'global') {
        const res = await axios.get(`${API_URL}/leaderboard`);
        setLeaderboard(res.data);
      } else if (activeTab === 'league') {
        const res = await axios.get(`${API_URL}/leaderboard?league=${user?.league || 'Bronze'}`);
        setLeaderboard(res.data);
      } else if (activeTab === 'friends') {
        const res = await axios.get(`${API_URL}/friends`);
        setLeaderboard(res.data);
      }

      const reqRes = await axios.get(`${API_URL}/friends/requests`);
      setFriendRequests(reqRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.league]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async (targetId) => {
    try {
      await axios.post(`${API_URL}/friends/request/${targetId}`);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (sourceId) => {
    try {
      await axios.post(`${API_URL}/friends/accept/${sourceId}`);
      toast.success('Friend request accepted!');
      fetchData();
      refreshUser();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-heading font-bold text-slate-500 text-lg">{rank}</span>;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 shadow-[0_4px_20px_rgba(251,191,36,0.2)]';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-slate-100';
  };

  const userRank = leaderboard.find(entry => entry.user_id === user?.id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-600 via-purple-600 to-sky-500 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="font-heading font-extrabold text-3xl">Leaderboard</h1>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl">
              <Shield className="w-5 h-5 text-indigo-200" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-indigo-100 tracking-wider">Current League</span>
                <span className="text-sm font-heading font-extrabold text-white leading-none">{user?.league || 'Bronze'}</span>
              </div>
            </div>
          </div>

          {/* Podiums - Only show if enough data */}
          {leaderboard.length >= 3 && (!loading) && (
            <div className="flex items-end justify-center gap-4 pt-2 pb-6 scale-90 sm:scale-100 origin-bottom">
              {/* 2nd place */}
              <div className="text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 ring-2 ring-white/30">
                  <span className="font-heading font-bold text-xl">{leaderboard[1]?.name?.[0]}</span>
                </div>
                <p className="font-bold text-sm truncate max-w-[72px]">{leaderboard[1]?.name}</p>
                <p className="text-white/70 text-xs">{leaderboard[1]?.xp} XP</p>
                <div className="mt-2 bg-slate-300/70 backdrop-blur-sm rounded-t-xl h-20 w-[72px] flex items-center justify-center">
                  <span className="font-heading font-bold text-3xl text-slate-600">2</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="text-center -mt-6">
                <div className="relative">
                  <Crown className="w-6 h-6 text-yellow-300 mx-auto mb-1 animate-bounce" style={{ animationDuration: '2.4s' }} />
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 ring-4 ring-yellow-200 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                    <span className="font-heading font-bold text-3xl text-yellow-800">{leaderboard[0]?.name?.[0]}</span>
                  </div>
                </div>
                <p className="font-bold text-sm truncate max-w-[88px]">{leaderboard[0]?.name}</p>
                <p className="text-white/70 text-xs">{leaderboard[0]?.xp} XP</p>
                <div className="mt-2 bg-gradient-to-b from-yellow-300 to-amber-400 rounded-t-xl h-28 w-[88px] flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  <Crown className="w-10 h-10 text-yellow-700" />
                </div>
              </div>

              {/* 3rd place */}
              <div className="text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 ring-2 ring-white/30">
                  <span className="font-heading font-bold text-xl">{leaderboard[2]?.name?.[0]}</span>
                </div>
                <p className="font-bold text-sm truncate max-w-[72px]">{leaderboard[2]?.name}</p>
                <p className="text-white/70 text-xs">{leaderboard[2]?.xp} XP</p>
                <div className="mt-2 bg-amber-600/70 backdrop-blur-sm rounded-t-xl h-14 w-[72px] flex items-center justify-center">
                  <span className="font-heading font-bold text-3xl text-amber-100">3</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-2xl mx-auto px-6 flex items-center gap-8 h-14">
          {[
            { id: 'league', label: 'League', icon: Shield },
            { id: 'global', label: 'Global', icon: Globe },
            { id: 'friends', label: 'Friends', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 h-full px-2 font-heading font-bold text-sm transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : ''}`} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {/* Pending Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-8 animate-in slide-in-from-top duration-500">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserPlus className="w-3 h-3 text-indigo-500" />
              Pending Requests ({friendRequests.length})
            </h2>
            <div className="space-y-2">
              {friendRequests.map(req => (
                <div key={req.id} className="bg-white p-3 rounded-2xl border-2 border-indigo-100 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {req.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{req.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Level {req.level}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all active:scale-90"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="stratos-card text-center py-16 bg-white flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="font-heading font-bold text-xl text-slate-800 mb-2">No Rankings Found</h2>
            <p className="text-slate-500 text-sm max-w-[200px]">
              {activeTab === 'friends' ? "Add some friends to compete with them!" : "Keep practicing to climb the ranks!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const isUser = entry.user_id === user?.id;
              const isFriend = user?.friends?.includes(entry.user_id) || activeTab === 'friends';

              return (
                <div
                  key={entry.user_id}
                  className={`rounded-3xl border-2 p-4 flex items-center gap-4 transition-all hover:scale-[1.01] ${getRankStyle(entry.rank)} ${isUser ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
                    }`}
                >
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {getRankBadge(entry.rank)}
                  </div>

                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-heading font-extrabold text-xl shadow-lg ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      isUser ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}>
                      {entry.name[0]}
                    </div>
                    {entry.rank === 1 && <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-pulse" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-slate-800 truncate leading-tight italic">
                        {entry.name}
                      </p>
                      {isUser && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-tighter">You</span>
                      )}
                      {!isUser && !isFriend && activeTab !== 'global' && (
                        <button
                          onClick={() => handleSendRequest(entry.user_id)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors group"
                          title="Send Friend Request"
                        >
                          <UserPlus className="w-4 h-4 group-hover:scale-110" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none bg-slate-100 px-1.5 py-0.5 rounded">Lv. {entry.level}</span>
                      {entry.league && entry.league !== 'Bronze' && (
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none bg-indigo-50 px-1.5 py-0.5 rounded italic">{entry.league}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Zap className="w-4 h-4 fill-indigo-600" />
                      <span className="font-heading font-extrabold text-base">{entry.xp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                      <Flame className="w-3 h-3 fill-orange-500" />
                      <span className="font-extrabold text-[11px]">{entry.streak}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Your Rank Bar if not visible */}
      {userRank && activeTab !== 'friends' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-4 text-white shadow-2xl shadow-indigo-500/20 backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-heading font-extrabold">#{userRank.rank}</div>
            <div className="flex-1">
              <p className="font-heading font-bold text-sm">You're in #{userRank.rank} place!</p>
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Keep going to reach {user?.league || 'Bronze'} Peak</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-indigo-400">
                <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                <span className="font-heading font-extrabold text-sm">{userRank.xp}</span>
              </div>
              <Link to="/shop" className="text-[10px] text-yellow-400 font-extrabold underline decoration-yellow-400/30 underline-offset-2">Use Boosters</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
