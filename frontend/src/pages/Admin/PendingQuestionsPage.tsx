import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, Sparkles, TreePine } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

import { api } from '../../services/api';
import type { Question, Category } from '../../types';
import { Modal } from '../../components/ui/Modal';

export default function PendingQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [normalizedQuestionText, setNormalizedQuestionText] = useState('');

  const [isPreparing, setIsPreparing] = useState(false);
  const [isNewCategorySuggested, setIsNewCategorySuggested] = useState(false);
  const [suggestedCategoryName, setSuggestedCategoryName] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [pending, cats] = await Promise.all([
        api.getPendingQuestions(),
        api.getCategories()
      ]);
      setQuestions(pending);
      setCategories(cats);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const openAnswerModal = async (q: Question) => {
    setSelectedQuestion(q);
    setNormalizedQuestionText(
      q.text.charAt(0).toUpperCase() + q.text.slice(1).toLowerCase().replace('?', '') + '?'
    );
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
    setAnswerText('');
    setIsAnswerModalOpen(true);
    setIsPreparing(true);
    setIsNewCategorySuggested(false);
    setSuggestedCategoryName('');

    try {
      const prep = await api.prepareQuestionForAdmin(q.id);
      if (prep.normalizedQuestion) {
        setNormalizedQuestionText(prep.normalizedQuestion);
      }
      if (prep.isNewCategory) {
        setIsNewCategorySuggested(true);
        setSuggestedCategoryName(prep.suggestedCategory);
        setSelectedCategory('new_category');
      } else if (prep.suggestedCategoryId) {
        setSelectedCategory(String(prep.suggestedCategoryId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedQuestion || !selectedCategory || !answerText.trim()) return;
    
    let finalCategoryId = selectedCategory;
    if (selectedCategory === 'new_category' && suggestedCategoryName) {
      try {
        const newCat = await api.addCategory(suggestedCategoryName);
        finalCategoryId = newCat.id;
        setCategories(prev => [...prev, newCat]);
      } catch (e) {
        console.error("Yeni kategori oluşturulamadı", e);
        return;
      }
    }

    await api.answerQuestion(selectedQuestion.id, answerText, finalCategoryId, normalizedQuestionText);
    setQuestions(questions.filter(q => q.id !== selectedQuestion.id));
    setIsAnswerModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      await api.deleteQuestionAsAdmin(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleAddSubmit = async () => {
    if (!newQuestionText.trim() || !selectedCategory || !answerText.trim()) return;
    await api.createQuestionAsAdmin(newQuestionText, answerText, selectedCategory);
    setIsAddModalOpen(false);
    setNewQuestionText('');
    setAnswerText('');
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-10 animate-fade-in">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold mb-4">
            <TreePine size={14} />
            <span>İnceleme Kuyruğu</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Bekleyen Sorular</h2>
          <p className="text-dpu-textMuted text-lg">10'dan fazla favorisi olan ve cevaplanmayı bekleyen sorular.</p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all active:scale-95 whitespace-nowrap"
          onClick={() => {
            setNewQuestionText('');
            setAnswerText('');
            if (categories.length > 0) setSelectedCategory(categories[0].id);
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} /> Yeni SSS Ekle
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-2 border-dpu-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-16 text-center text-dpu-textMuted text-lg">
          Cevaplanmayı bekleyen soru bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-dpu-green/30 transition-all">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-3">{q.text}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dpu-textMuted">
                  <span className="flex items-center gap-1.5">

                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-dpu-green/20 border border-dpu-green/30 rounded-full flex items-center justify-center text-xs font-black text-dpu-green">
                      {q.authorName.charAt(0)}
                    </div>
                    {q.authorName} {q.authorFaculty && `· ${q.authorDepartment}`}
                  </span>
                  <span>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-dpu-green/10 text-dpu-green border border-dpu-green/20 rounded-xl hover:bg-dpu-green/20 transition-all font-bold text-sm"
                  onClick={() => openAnswerModal(q)}
                >
                  <MessageSquare size={16} /> Cevapla
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm"
                  onClick={() => handleDelete(q.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Modal */}
      <Modal isOpen={isAnswerModalOpen} onClose={() => setIsAnswerModalOpen(false)} title="Soruyu Cevapla">
        {selectedQuestion && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-dpu-navy/50 border border-white/10">
              <span className="text-xs font-black text-dpu-green uppercase tracking-wider">Orijinal Soru</span>
              <p className="mt-2 text-white font-medium">{selectedQuestion.text}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> AI Normalize Edilmiş Soru
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all"
                  value={normalizedQuestionText}
                  onChange={(e) => setNormalizedQuestionText(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Kategori
                </label>
                <select
                  className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (e.target.value !== 'new_category') setIsNewCategorySuggested(false);
                  }}
                  disabled={isPreparing}
                >
                  <option value="" disabled className="bg-dpu-navy">Kategori Seçin</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-dpu-navy">{c.name}</option>
                  ))}
                  {isNewCategorySuggested && (
                    <option value="new_category" className="bg-dpu-navy text-amber-400">
                      + Yeni Kategori (AI): {suggestedCategoryName}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">Cevap</label>
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all resize-y placeholder:text-dpu-textMuted/50"
                  placeholder="Sorunun cevabını buraya yazın..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button className="px-6 py-2 text-dpu-textMuted hover:text-white transition-colors font-bold" onClick={() => setIsAnswerModalOpen(false)}>İptal</button>
              <button
                className="px-8 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all disabled:opacity-50"
                onClick={handleAnswerSubmit}
                disabled={!answerText.trim() || !selectedCategory}
              >
                Yayımla
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New SSS Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni SSS Ekle">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">Soru</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
              placeholder="Soru metnini girin..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">Kategori</label>
            <select
              className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-dpu-navy">{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">Cevap</label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all resize-y placeholder:text-dpu-textMuted/50"
              placeholder="Sorunun cevabını buraya yazın..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button className="px-6 py-2 text-dpu-textMuted hover:text-white transition-colors font-bold" onClick={() => setIsAddModalOpen(false)}>İptal</button>
            <button
              className="px-8 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all disabled:opacity-50"
              onClick={handleAddSubmit}
              disabled={!newQuestionText.trim() || !answerText.trim() || !selectedCategory}
            >
              Yayımla
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
