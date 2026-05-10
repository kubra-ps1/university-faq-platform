import React, { useState, useEffect } from 'react';
import { User, Lock, Heart, Bookmark, Trash2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';

import { api } from '../../services/api';
import type { Question } from '../../types';
import { Badge } from '../../components/ui/Badge';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'interests'>('questions');
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [myInterests, setMyInterests] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{full_name?: string, email?: string, created_at?: string} | null>(null);

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [questions, interests, user] = await Promise.all([
          api.getStudentQuestions(),
          api.getStudentInterests(),
          api.getUserProfile().catch(() => null)
        ]);
        setMyQuestions(questions);
        setMyInterests(interests);
        if (user) setUserProfile(user);
      } catch (error) {
        console.error("Veriler çekilirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteQuestion = async (id: string) => {
    await api.deleteMyQuestion(id);
    setMyQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleRemoveInterest = async (id: string) => {
    await api.removeInterest(id);
    setMyInterests(prev => prev.filter(q => q.id !== id));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    try {
      await api.changePassword(passwordForm.current, passwordForm.new);
      setPasswordForm({ current: '', new: '', confirm: '' });
      alert('Şifre başarıyla güncellendi!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert('Hata: ' + (error?.response?.data?.detail || 'Şifre güncellenemedi.'));
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'answered':
        return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Cevaplandı</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle size={12} className="mr-1" /> Reddedildi</Badge>;
      default:
        return <Badge variant="warning"><Clock size={12} className="mr-1" /> Bekleniyor</Badge>;
    }
  };

  return (
    <StudentLayout userName={userProfile?.full_name || userProfile?.email || 'Öğrenci'}>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Profile Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-dpu-green/10 border-2 border-dpu-green/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,237,100,0.1)]">
              <User size={48} className="text-dpu-green" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">{userProfile?.full_name || 'Öğrenci'}</h2>
            <p className="text-dpu-textMuted text-sm mb-4">{userProfile?.email || 'ogrenci@dpu.edu.tr'}</p>
            <div className="w-full pt-4 border-t border-white/5 flex justify-between text-sm">
              <span className="text-dpu-textMuted">Kayıt Tarihi</span>
              <span className="font-bold text-dpu-green">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : 'Yükleniyor...'}
              </span>
            </div>
          </div>

          <div className="glass-card col-span-1 md:col-span-2 p-8">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 uppercase tracking-wider">
              <Lock size={20} className="text-dpu-green" /> Şifre Değiştir
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="password"
                  placeholder="Mevcut Şifre"
                  className="px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
                  value={passwordForm.current}
                  onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  required
                />
                <div className="hidden md:block"></div>
                <input
                  type="password"
                  placeholder="Yeni Şifre"
                  className="px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
                  value={passwordForm.new}
                  onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  placeholder="Yeni Şifre (Tekrar)"
                  className="px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all active:scale-95"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="glass-card overflow-hidden">
          <div className="flex border-b border-white/5">
            <button
              className={`flex-1 py-5 text-center font-black uppercase tracking-widest text-sm transition-all ${
                activeTab === 'questions'
                  ? 'border-b-2 border-dpu-green text-dpu-green bg-dpu-green/5'
                  : 'text-dpu-textMuted hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              Sorularım
            </button>
            <button
              className={`flex-1 py-5 text-center font-black uppercase tracking-widest text-sm transition-all ${
                activeTab === 'interests'
                  ? 'border-b-2 border-dpu-green text-dpu-green bg-dpu-green/5'
                  : 'text-dpu-textMuted hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('interests')}
            >
              İlgilendiklerim
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-dpu-green border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {activeTab === 'questions' && (
                  myQuestions.length === 0 ? (
                    <div className="text-center py-12 text-dpu-textMuted text-lg">
                      Henüz hiç soru sormadınız.
                    </div>
                  ) : (
                    myQuestions.map(q => (
                      <div key={q.id} className="p-5 rounded-xl border border-white/5 hover:border-dpu-green/30 flex flex-col transition-all bg-dpu-navy/20">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="flex-1">
                            <h4 className="font-bold text-white mb-2">{q.text}</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <StatusBadge status={q.status} />
                              {q.favoriteCount !== undefined && (
                                <span className="flex items-center gap-1 text-dpu-textMuted">
                                  <Heart size={14} className="text-dpu-green" /> {q.favoriteCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                            {q.status === 'answered' ? (
                              <button
                                className="flex items-center gap-2 px-4 py-2 bg-dpu-green/10 text-dpu-green border border-dpu-green/20 rounded-xl hover:bg-dpu-green/20 transition-all font-bold text-sm"
                                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                              >
                                <Eye size={16} /> İncele
                              </button>
                            ) : (
                              <button
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm"
                                onClick={() => handleDeleteQuestion(q.id)}
                              >
                                <Trash2 size={16} /> Sil
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedId === q.id && q.answer && (
                          <div className="mt-4 p-4 rounded-lg bg-dpu-navy/50 border border-white/5 text-dpu-textMuted text-sm animate-fade-in">
                            <strong className="text-white">Cevap: </strong> {q.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}

                {activeTab === 'interests' && (
                  myInterests.length === 0 ? (
                    <div className="text-center py-12 text-dpu-textMuted text-lg">
                      Henüz ilgilendiğiniz bir soru bulunmuyor.
                    </div>
                  ) : (
                    myInterests.map(q => (
                      <div key={q.id} className="p-5 rounded-xl border border-white/5 hover:border-dpu-green/30 flex flex-col transition-all bg-dpu-navy/20">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="flex-1">
                            <h4 className="font-bold text-white mb-2 flex items-start gap-2">
                              <Bookmark size={16} className="text-dpu-green fill-current mt-0.5 flex-shrink-0" />
                              {q.text}
                            </h4>
                            <div className="flex items-center gap-3 text-sm">
                              <StatusBadge status={q.status} />
                              {q.favoriteCount !== undefined && (
                                <span className="flex items-center gap-1 text-dpu-textMuted">
                                  <Heart size={14} className="text-dpu-green" /> {q.favoriteCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                            {q.status === 'answered' && (
                              <button
                                className="flex items-center gap-2 px-4 py-2 bg-dpu-green/10 text-dpu-green border border-dpu-green/20 rounded-xl hover:bg-dpu-green/20 transition-all font-bold text-sm"
                                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                              >
                                <Eye size={16} /> İncele
                              </button>
                            )}
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm"
                              onClick={() => handleRemoveInterest(q.id)}
                              title="Listeden Çıkar"
                            >
                              <Trash2 size={16} /> Sil
                            </button>
                          </div>
                        </div>
                        {expandedId === q.id && q.answer && (
                          <div className="mt-4 p-4 rounded-lg bg-dpu-navy/50 border border-white/5 text-dpu-textMuted text-sm animate-fade-in">
                            <strong className="text-white">Cevap: </strong> {q.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
