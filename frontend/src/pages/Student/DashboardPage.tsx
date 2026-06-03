import React, { useState, useEffect } from 'react';

import { Search, ChevronDown, ChevronUp, Info, Send, TreePine, Heart, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';

import { api } from '../../services/api';
import type { Category, Question } from '../../types';


export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<Record<string, Question[]>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [userName, setUserName] = useState('Öğrenci');
  const [isLoading, setIsLoading] = useState(true);
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ type: 'exact' | 'similar' | 'none' | null, data: Question[] }>({ type: null, data: [] });

  const [newQuestionText, setNewQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showResultCard, setShowResultCard] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        try {
          const counts = await api.getCategoryCounts();
          setCategoryCounts(counts);
        } catch (err) {
          console.error("Sayılar yüklenemedi", err);
        }
      } catch(e) {}
    };
    const fetchUser = async () => {
      try {
        const user = await api.getUserProfile();
        setUserName(user.full_name || user.email || 'Öğrenci');
      } catch (e) {}
    };
    
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchCategories(), fetchUser()]);
      try {
        const interests = await api.getStudentInterests();
        setSavedQuestionIds(new Set(interests.map(i => i.id)));
      } catch (e) {}
      setIsLoading(false);
    };
    init();
  }, []);

  const handleCategoryClick = async (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(categoryId);
    if (!categoryQuestions[categoryId]) {
      const questions = await api.getQuestionsByCategory(categoryId);
      setCategoryQuestions(prev => ({ ...prev, [categoryId]: questions }));
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 3) {
      setIsSearching(true);
      const results = await api.searchQuestions(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults({ type: null, data: [] });
    }
  };



  const handleAskQuestion = async () => {
    if (!newQuestionText.trim()) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setShowResultCard(false);
    
    const result = await api.askQuestion(newQuestionText);
    setIsSubmitting(false);
    
    if (result.success) {
      setSubmitResult({ type: 'success', text: result.message });
      setShowResultCard(true);
      setNewQuestionText('');
      setTimeout(() => dismissResult(), 3000);
    } else {
      setSubmitResult({ type: 'error', text: result.message });
      setShowResultCard(true);
      setTimeout(() => dismissResult(), 4000);
    }
  };

  const dismissResult = () => {
    setShowResultCard(false);
    setTimeout(() => setSubmitResult(null), 500);
  };

  const toggleSave = async (q: Question) => {
    const isSaved = savedQuestionIds.has(q.id);
    try {
      if (isSaved) {
        await api.removeInterest(q.id);
        setSavedQuestionIds(prev => { const n = new Set(prev); n.delete(q.id); return n; });
        setSearchResults(prev => ({...prev, data: prev.data.map(item => item.id === q.id ? {...item, favoriteCount: Math.max(0, (item.favoriteCount || 1) - 1)} : item)}));
      } else {
        await api.saveInterest(q.id);
        setSavedQuestionIds(prev => { const n = new Set(prev); n.add(q.id); return n; });
        setSearchResults(prev => ({...prev, data: prev.data.map(item => item.id === q.id ? {...item, favoriteCount: (item.favoriteCount || 0) + 1} : item)}));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <StudentLayout userName={userName}>
      <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-12 -mt-12 bg-gradient-to-b from-dpu-navy to-dpu-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.08] transform rotate-6 scale-[3] blur-[2px]">
          <TreePine size={400} strokeWidth={0.5} className="text-dpu-green" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">

          
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight text-white drop-shadow-2xl">
            Sor, Öğren, <span className="text-dpu-green">İlerle.</span>
          </h1>
          <p className="text-dpu-textMuted max-w-2xl mx-auto mb-10 font-medium text-lg">
            Dumlupınar Üniversitesi hakkında her şey burada seni bekliyor.
          </p>

          <div className="relative max-w-3xl mx-auto group">
            <div className="glass-card p-1.5 rounded-[1.5rem] border-white/10">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-dpu-green" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-16 pr-6 py-5 rounded-[1.2rem] bg-dpu-navy/50 text-white text-lg border border-white/5 focus:border-dpu-green/50 outline-none transition-all duration-300 placeholder:text-dpu-textMuted/50"
                  placeholder="Hemen bir soru arat..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
            {isSearching && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-4 inline-flex items-center gap-3 px-4 py-2 glass rounded-full text-dpu-green text-sm font-bold animate-pulse">
                Tarama yapılıyor...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {searchResults.type && searchResults.data.length > 0 && (
          <div className="animate-slide-up mb-12 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-white">BULUNAN SONUÇLAR</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-dpu-green/50 to-transparent"></div>
            </div>
            
            {searchResults.data.map(q => (
              <div key={q.id} className="glass-card p-6 border-l-4 border-l-dpu-green relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 rounded-md bg-dpu-green/10 text-dpu-green text-xs font-bold mb-3">
                      {q.answer ? 'CEVAPLANDI' : 'HAVUZDA'}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{q.text}</h4>
                  </div>
                  <button 
                    onClick={() => toggleSave(q)}
                    className="flex flex-col items-center justify-center gap-1 text-dpu-textMuted hover:text-dpu-green transition-colors mt-1"
                    title={savedQuestionIds.has(q.id) ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                  >
                    <Heart size={24} className={savedQuestionIds.has(q.id) ? "fill-dpu-green text-dpu-green" : ""} />
                    <span className="text-xs font-bold">{q.favoriteCount || 0}</span>
                  </button>
                </div>
                {q.answer && (
                  <div className="p-4 rounded-xl bg-dpu-navy/40 border border-white/5 text-dpu-text leading-relaxed mt-2">
                    {q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 order-2 lg:order-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dpu-green"></div>
              </div>
            ) : !searchQuery ? (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Sıkça Sorulan Sorular</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="glass-card overflow-hidden transition-all duration-300 hover:border-white/20">
                      <button
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-xl text-white">{category.name}</span>
                          <span className="bg-dpu-green/10 text-dpu-green py-0.5 px-3 rounded-md text-xs font-black">
                            {categoryCounts[category.id] !== undefined ? categoryCounts[category.id] : category.questionCount}
                          </span>
                        </div>
                        <div className="p-1 rounded-md bg-white/5">
                          {expandedCategory === category.id ? <ChevronUp size={20} className="text-dpu-green" /> : <ChevronDown size={20} className="text-dpu-textMuted" />}
                        </div>
                      </button>

                      {expandedCategory === category.id && (
                        <div className="px-6 pb-6 pt-2 space-y-3 animate-slide-up">
                          {categoryQuestions[category.id]?.map(q => (
                            <div key={q.id} className="p-4 rounded-xl bg-dpu-navy/30 border border-white/5">
                              <button
                                className="w-full text-left flex justify-between items-center group"
                                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                              >
                                <span className="font-bold text-dpu-text group-hover:text-white transition-colors">{q.text}</span>
                                {expandedQuestion === q.id ? <ChevronUp size={16} className="text-dpu-green" /> : <ChevronDown size={16} className="text-dpu-textMuted" />}
                              </button>
                              {expandedQuestion === q.id && (
                                <div className="mt-3 pt-3 border-t border-white/5 text-dpu-textMuted text-sm leading-relaxed">
                                  {q.answer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="sticky top-24">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Cevap Bulamadın mı?</h3>
              </div>
              <div className="glass-card p-6 border-t-4 border-t-dpu-green">
                <p className="text-dpu-textMuted text-sm mb-4 font-medium">
                  Merak ettiğin konuyu sor.
                </p>
                <textarea
                  className="w-full min-h-[150px] p-4 bg-dpu-navy/50 border border-white/10 rounded-xl text-white focus:border-dpu-green/50 outline-none transition-all resize-none mb-4 placeholder:text-dpu-textMuted/50"
                  placeholder="Sorunu buraya yaz..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="space-y-4">
                  <button 
                    onClick={handleAskQuestion} 
                    disabled={isSubmitting || !newQuestionText.trim()}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.4)] transition-all disabled:opacity-50"
                  >
                    SORUYU GÖNDER
                    <Send size={18} />
                  </button>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3">
                  <Info className="text-dpu-green shrink-0" size={20} />
                  <p className="text-[11px] text-dpu-textMuted leading-relaxed">
                    Sorunuz gönderilmeden önce AI tarafından uygunluk kontrolünden geçirilir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center ai-overlay-enter" style={{ pointerEvents: 'all' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="ai-spinner mb-8">
              <svg className="ai-spinner-svg" viewBox="0 0 100 100">
                <circle className="ai-spinner-track" cx="50" cy="50" r="42" />
                <circle className="ai-spinner-progress" cx="50" cy="50" r="42" />
              </svg>
              <div className="ai-spinner-icon">
                <ShieldAlert size={30} className="text-dpu-green" />
              </div>
            </div>
            <p className="text-white font-bold text-xl mb-2 drop-shadow-lg">AI Kontrol Ediliyor</p>
            <p className="text-dpu-textMuted text-sm animate-pulse">Sorunuz güvenlik kontrolünden geçiriliyor...</p>
          </div>
        </div>
      )}

      {submitResult && (
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center ai-overlay-enter ${
            !showResultCard ? 'pointer-events-none' : ''
          }`}
          onClick={dismissResult}
          style={{ pointerEvents: showResultCard ? 'all' : 'none' }}
        >
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            showResultCard ? 'opacity-100' : 'opacity-0'
          }`} />
          <div className={`relative z-10 w-full max-w-md mx-4 result-card ${
            showResultCard ? 'result-card-enter' : 'result-card-exit'
          } ${
            submitResult.type === 'error' ? 'result-card-error' : 'result-card-success'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-px ${
              submitResult.type === 'error'
                ? 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent'
                : 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent'
            }`} />
            
            <div className="flex flex-col items-center text-center py-4">
              <div className={`p-4 rounded-2xl mb-5 ${
                submitResult.type === 'error'
                  ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                  : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
              }`}>
                {submitResult.type === 'error'
                  ? <ShieldAlert size={36} className="text-red-400" />
                  : <CheckCircle size={36} className="text-emerald-400" />
                }
              </div>
              
              
              <h3 className={`text-lg font-black uppercase tracking-wider mb-2 ${
                submitResult.type === 'error' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {submitResult.type === 'error' ? 'Soru Reddedildi' : 'Başarıyla Gönderildi!'}
              </h3>
              
              
              <p className={`text-sm font-medium leading-relaxed max-w-xs ${
                submitResult.type === 'error' ? 'text-red-300/80' : 'text-emerald-300/80'
              }`}>
                {submitResult.text}
              </p>

              
              <div className="w-full mt-6 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${
                  submitResult.type === 'error'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                } ${showResultCard ? 'result-progress-bar' : ''}`}
                  style={{ animationDuration: submitResult.type === 'error' ? '4s' : '3s' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
