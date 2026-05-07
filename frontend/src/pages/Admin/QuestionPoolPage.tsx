import { useState, useEffect } from 'react';
import { Heart, Trash2, TreePine } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

import { api } from '../../services/api';
import type { Question } from '../../types';

export default function QuestionPoolPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const pool = await api.getAllPoolQuestions();
    setQuestions(pool);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu soruyu havuzdan silmek istediğinize emin misiniz?')) {
      await api.deleteQuestionAsAdmin(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dpu-green/10 border border-dpu-green/20 text-dpu-green text-sm font-bold mb-4">
          <TreePine size={14} />
          <span>Arşiv</span>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Soru Havuzu</h2>
        <p className="text-dpu-textMuted text-lg">Öğrenciler tarafından sorulan ve henüz cevaplanmamış tüm soruların listesi.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-2 border-dpu-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-16 text-center text-dpu-textMuted text-lg">
          Havuzda soru bulunmuyor.
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
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm"
                  onClick={() => handleDelete(q.id)}
                >
                  <Trash2 size={16} /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
