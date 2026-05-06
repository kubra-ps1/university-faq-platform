import { useEffect, useState } from 'react';
import { Users, FileQuestion, Clock, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminLayout } from '../../components/layout/AdminLayout';

import { api } from '../../services/api';
import type { KeywordData, TrafficData } from '../../types';

const COLORS = ['#00ED64', '#00684A', '#72FF96', '#00A35C', '#13AA52'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalQuestions: 0, pendingQuestions: 0, totalStudents: 0 });
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedStats, keywords, traffic] = await Promise.all([
        api.getDashboardStats(),
        api.getKeywordData(),
        api.getTrafficData()
      ]);
      setStats(fetchedStats);
      setKeywordData(keywords);
      setTrafficData(traffic);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-dpu-green">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dpu-green/10 border border-dpu-green/20 text-dpu-green text-sm font-bold mb-4">
          <Sparkles size={14} />
          <span>Sistem Genel Durumu</span>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Yönetici Paneli</h2>
        <p className="text-dpu-textMuted text-lg font-medium">Platformun performans verilerini ve istatistiklerini takip edin.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default border-dpu-green/20">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-dpu-green group-hover:opacity-30 transition-opacity">
            <FileQuestion size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-dpu-textMuted text-sm font-black mb-2 uppercase tracking-widest">TOPLAM SORU</p>
            <h3 className="text-5xl font-black text-dpu-green">{stats.totalQuestions}</h3>
          </div>
        </div>
        
        <div className="glass-card p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default border-amber-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-amber-500 group-hover:opacity-30 transition-opacity">
            <Clock size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-dpu-textMuted text-sm font-black mb-2 uppercase tracking-widest">BEKLEYENLER</p>
            <h3 className="text-5xl font-black text-amber-500">{stats.pendingQuestions}</h3>
          </div>
        </div>

        <div className="glass-card p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default border-blue-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-blue-500 group-hover:opacity-30 transition-opacity">
            <Users size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-dpu-textMuted text-sm font-black mb-2 uppercase tracking-widest">ÖĞRENCİLER</p>
            <h3 className="text-5xl font-black text-blue-500">{stats.totalStudents}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-card p-8">
          <h3 className="text-xl font-black text-white mb-8 uppercase tracking-wider">Popüler Aramalar</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={keywordData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={8}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {keywordData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#002B3D', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-black text-white mb-8 uppercase tracking-wider">Soru Trafiği</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A2B1B5', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A2B1B5', fontWeight: 700 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#002B3D', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="questions" 
                  stroke="#00ED64" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#00ED64', strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: '#fff', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
