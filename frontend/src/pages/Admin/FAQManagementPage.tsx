import { useState, useEffect } from 'react';
import { Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

import { api } from '../../services/api';
import type { Question } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export default function FAQManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editText, setEditText] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const answered = await api.getAnsweredQuestions();
      setQuestions(answered);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const openEditModal = (q: Question) => {
    setSelectedQuestion(q);
    setEditText(q.text);
    setEditAnswer(q.answer || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedQuestion || !editText.trim() || !editAnswer.trim()) return;
    
    await api.editAnsweredQuestion(selectedQuestion.id, editText, editAnswer);
    
    setQuestions(questions.map(q => 
      q.id === selectedQuestion.id 
        ? { ...q, text: editText, answer: editAnswer } 
        : q
    ));
    setIsEditModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu soruyu kalıcı olarak silmek istediğinize emin misiniz? Soru SSS listesinden tamamen kalkacaktır.')) {
      await api.deleteQuestionAsAdmin(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Aktif SSS Yönetimi</h2>
        <p className="text-dpu-textMuted">Yayında olan, cevaplanmış sıkça sorulan soruları düzenleyin veya silin.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
          Yayında olan SSS bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id} className="p-5 flex flex-col gap-4 border-l-4 border-l-dpu-green">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-dpu-green" />
                    <span className="text-xs font-bold text-dpu-green uppercase tracking-wide">Yayında</span>
                  </div>
                  <h4 className="text-lg font-medium text-dpu-text mb-2">{q.text}</h4>
                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-gray-100 mb-3">
                    {q.answer}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Tarih: {new Date(q.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button variant="outline" className="w-full sm:w-auto text-sm px-3" onClick={() => openEditModal(q)} title="Düzenle">
                    <Edit2 size={16} className="mr-1" /> Düzenle
                  </Button>
                  <Button variant="danger" className="w-full sm:w-auto px-3 text-sm" onClick={() => handleDelete(q.id)} title="Kalıcı Olarak Sil">
                    <Trash2 size={16} className="mr-1" /> Sil
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="SSS Düzenle">
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">
                Soru Metni
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">
                Cevap
              </label>
              <textarea
                className="w-full min-h-[150px] px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all resize-y placeholder:text-dpu-textMuted/50"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button className="px-6 py-2 text-dpu-textMuted hover:text-white transition-colors font-bold" onClick={() => setIsEditModalOpen(false)}>İptal</button>
              <button
                className="px-8 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all disabled:opacity-50"
                onClick={handleEditSubmit}
                disabled={!editText.trim() || !editAnswer.trim()}
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        )}
      </Modal>

    </AdminLayout>
  );
}
