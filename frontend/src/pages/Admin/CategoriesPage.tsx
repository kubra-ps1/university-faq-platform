import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

import { api } from '../../services/api';
import type { Category } from '../../types';
import { Modal } from '../../components/ui/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const cats = await api.getCategories();
    setCategories(cats);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz? Altındaki sorular etkilenebilir.')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setCategoryName(c.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) return;
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryName } : c));
    } else {
      const newCat: Category = { id: Date.now().toString(), name: categoryName, questionCount: 0 };
      setCategories([...categories, newCat]);
    }
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-10 animate-fade-in">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dpu-green/10 border border-dpu-green/20 text-dpu-green text-sm font-bold mb-4">
            <span>Yapı</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Kategori Yönetimi</h2>
          <p className="text-dpu-textMuted text-lg">SSS kategorilerini ekleyin, düzenleyin veya silin.</p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all active:scale-95 whitespace-nowrap"
          onClick={openAddModal}
        >
          <Plus size={18} /> Yeni Kategori
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-2 border-dpu-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-card p-16 text-center text-dpu-textMuted text-lg">
          Henüz kategori bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.id} className="glass-card p-6 flex flex-col justify-between hover:border-dpu-green/30 transition-all">
              <div className="mb-6">
                <h4 className="text-xl font-black text-white mb-1">{c.name}</h4>
                <p className="text-sm text-dpu-textMuted font-medium">{c.questionCount} Cevaplanmış Soru</p>
              </div>
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 text-white border border-white/10 rounded-xl hover:border-dpu-green/30 hover:text-dpu-green transition-all font-bold text-sm"
                  onClick={() => openEditModal(c)}
                >
                  <Edit2 size={16} /> Düzenle
                </button>
                <button
                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-black text-dpu-textMuted uppercase tracking-wider mb-2">Kategori Adı</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-dpu-navy/50 border border-white/10 text-white rounded-xl focus:border-dpu-green/50 outline-none transition-all placeholder:text-dpu-textMuted/50"
              placeholder="Örn: Yurt ve Barınma"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button className="px-6 py-2 text-dpu-textMuted hover:text-white transition-colors font-bold" onClick={() => setIsModalOpen(false)}>İptal</button>
            <button
              className="px-8 py-3 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,237,100,0.3)] transition-all disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!categoryName.trim()}
            >
              {editingCategory ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
