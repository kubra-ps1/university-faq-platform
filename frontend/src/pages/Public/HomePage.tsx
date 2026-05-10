import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, HelpCircle, TreePine, Sparkles } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

import { api } from '../../services/api';
import type { Category, Question } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<Record<string, Question[]>>({});
  const [isLoading, setIsLoading] = useState(true);


  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ type: 'exact' | 'similar' | 'none' | null, data: Question[] }>({ type: null, data: [] });

  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        
        try {
          const counts = await api.getCategoryCounts();
          setCategoryCounts(counts);
        } catch (countsError) {
          console.error("Kategori sayıları çekilemedi (Docker yeniden başlatılması gerekebilir):", countsError);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
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

    if (query.length > 2) {
      setIsSearching(true);
      const results = await api.searchQuestions(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults({ type: null, data: [] });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ type: null, data: [] });
  };

  return (
    <div className="min-h-screen flex flex-col bg-dpu-bg text-dpu-text overflow-hidden">
      <PublicNavbar />

      <main className="flex-1 w-full animate-fade-in relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-dpu-green/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-dpu-light/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Hero Section */}
        <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative">
          {/* Aesthetic Watermark Emblem */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.08] transform rotate-12 scale-[3] blur-[2px]">
            <TreePine size={400} strokeWidth={0.5} className="text-dpu-green" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dpu-green/10 border border-dpu-green/20 text-dpu-green text-sm font-medium mb-6 animate-slide-up">
              <Sparkles size={14} />
              <span>Dumlupınar Üniversitesi Akıllı Destek Sistemi</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight text-white drop-shadow-2xl">
              Aradığın Cevap <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-dpu-green to-dpu-light">Karanlıkta Parlasın.</span>
            </h1>
            
            <p className="text-xl text-dpu-textMuted max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Üniversite hayatına dair merak ettiğin her şey tek bir noktada. Hızlı, akıllı ve modern.
            </p>
            
            <div className="flex justify-center gap-6">
              <button 
                className="group relative px-10 py-4 bg-dpu-green text-dpu-navy font-black text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,237,100,0.4)] active:scale-95 overflow-hidden"
                onClick={() => setIsHowItWorksOpen(true)}
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center gap-2">
                  <HelpCircle size={24} />
                  Sistem Nasıl Çalışır?
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Aesthetic Float */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-20 mb-20">
          <div className="glass-card p-2 rounded-[2rem] border-white/10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-dpu-green group-focus-within:text-dpu-light transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-16 pr-6 py-6 rounded-[1.5rem] bg-dpu-navy/50 text-white text-xl border border-white/5 focus:border-dpu-green/50 outline-none transition-all duration-300 placeholder:text-dpu-textMuted/50"
                placeholder="Aklındaki soruyu buraya bırak..."
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-sm font-bold text-dpu-green hover:text-dpu-light transition-colors"
                >
                  TEMİZLE
                </button>
              )}
            </div>
          </div>
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-4 text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 glass rounded-full text-dpu-green text-sm font-bold animate-pulse">
                <div className="w-2 h-2 bg-dpu-green rounded-full"></div>
                Sistem taranıyor...
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 pb-20">
          
          {/* SEARCH RESULTS */}
          {searchResults.type && searchResults.data.length > 0 && (
            <div className="animate-slide-up space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-white">Sonuçlar</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-dpu-green/50 to-transparent"></div>
              </div>

              <div className="space-y-6">
                {searchResults.data.map(q => (
                  <div key={q.id} className="glass-card p-8 group hover:border-dpu-green/40 transition-all duration-500">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="inline-block px-3 py-1 rounded-md bg-dpu-green/10 text-dpu-green text-xs font-bold mb-3">
                          {q.answer ? 'CEVAPLANDI' : 'HAVUZDA'}
                        </div>
                        <h4 className="text-2xl font-bold text-white group-hover:text-dpu-green transition-colors mb-4">{q.text}</h4>
                        {q.answer && (
                          <div className="p-5 rounded-xl bg-dpu-navy/40 border border-white/5 text-dpu-text leading-relaxed">
                            {q.answer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH STATE 3: NONE FOUND */}
          {searchResults.type === 'none' && !isSearching && searchQuery.length > 2 && (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-dpu-navy rounded-full flex items-center justify-center mx-auto mb-6 border border-dpu-green/20">
                <Search className="text-dpu-green" size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Henüz bir kayıt yok.</h3>
              <p className="text-dpu-textMuted mb-8 text-lg">Bu soruyu ilk soran sen olabilirsin!</p>
              <Button onClick={() => navigate('/auth/login')} variant="primary" size="lg" className="px-12 py-4 text-lg">
                Soruyu Gönder
              </Button>
            </div>
          )}

          {/* CATEGORIES */}
          {!searchQuery && (
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-white">Kategoriler</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-dpu-green/50 to-transparent"></div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dpu-green"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {categories.map((category) => (
                  <div key={category.id} className="glass-card overflow-hidden group">
                    <button
                      className="w-full p-8 text-left transition-all duration-300 hover:bg-white/5"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white group-hover:text-dpu-green transition-colors">{category.name}</span>
                            <span className="bg-dpu-green/10 text-dpu-green py-0.5 px-3 rounded-md text-sm font-black">
                              {categoryCounts[category.id] !== undefined ? categoryCounts[category.id] : category.questionCount}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-dpu-navy border border-white/5">
                            {expandedCategory === category.id ? <ChevronUp className="text-dpu-green" /> : <ChevronDown className="text-dpu-textMuted" />}
                          </div>
                        </div>
                      </div>
                    </button>

                    {expandedCategory === category.id && (
                      <div className="p-6 bg-dpu-navy/40 border-t border-white/5 space-y-4 animate-slide-up">
                        {categoryQuestions[category.id]?.map(q => (
                          <div key={q.id} className="p-4 rounded-xl border border-white/5 hover:border-dpu-green/20 transition-all cursor-pointer">
                            <p className="font-bold text-dpu-text mb-2">{q.text}</p>
                            <p className="text-sm text-dpu-textMuted line-clamp-2">{q.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* How It Works Modal */}
      <Modal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} title="Platform Nasıl Çalışır?">
        <div className="space-y-10 p-4">
          {[
            { id: 1, t: 'Sorunu Arat', d: 'Sistem anında binlerce onaylanmış cevabı tarar.' },
            { id: 2, t: 'Topluluğa Katıl', d: 'Benzer soruları favorileyerek süreci hızlandır.' },
            { id: 3, t: 'Onay Al', d: 'Yeni soruların uzmanlarca incelenip cevaplansın.' }
          ].map(step => (
            <div key={step.id} className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-dpu-green text-dpu-navy rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-black shadow-[0_0_20px_rgba(0,237,100,0.3)]">
                {step.id}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">{step.t}</h3>
                <p className="text-dpu-textMuted text-lg leading-relaxed">{step.d}</p>
              </div>
            </div>
          ))}
          <div className="pt-8 flex justify-center">
            <Button variant="primary" size="lg" className="px-12 py-4 text-xl" onClick={() => setIsHowItWorksOpen(false)}>
              BAŞLA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
