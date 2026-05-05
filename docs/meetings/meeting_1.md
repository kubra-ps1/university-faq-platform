# 📝 Toplantı Notları: Proje Başlangıç ve Mimari Planlama
**Proje:** Akıllı Üniversite SSS Platformu  
**Versiyon:** v1.0.0

---

## 🎯 1. Proje Vizyonu
Öğrencilerin bilgiye erişimini kolaylaştırmak amacıyla, **Gemini AI** entegrasyonu ile güçlendirilmiş, dinamik kategorizasyon ve akıllı arama yeteneklerine sahip bir ekosistem inşa etmek.

### Temel Özellikler
* **AI Katmanı:** Soru-Cevap eşleştirmesi, otomatik etiketleme ve benzerlik analizi.
* **Kullanıcı Deneyimi:** "Bak" butonu (Bildirim), Favoriler, Gelişmiş arama.
* **Yönetim Paneli:** Admin onay mekanizması ve yapay zeka destekli cevap asistanı.

---

## 🏗 2. Teknik Yığın (Tech Stack)
| Katman | Teknoloji |
| :--- | :--- |
| **Frontend** | React (TypeScript), Vite, Tailwind CSS |
| **Backend** | FastAPI (Python 3.11+), Uvicorn |
| **Veritabanı** | PostgreSQL |
| **AI Motoru** | Google Gemini |
| **Altyapı** | Docker & Docker Compose |

---

## 📅 3. İlk Sprint Görev Dağılımı 

Sorumluluklar **Separation of Concerns** (Sorumlulukların Ayrılması) prensibine göre dağıtılmıştır:

### 🛠 **Dev 1: Data & Repository Architect**
* **Repo Yönetimi:** Git akışının kurulması (`.gitignore`, README, lisans).
* **Veritabanı Modelleme:** PostgreSQL için SQLAlchemy modellerinin tasarlanması.
* **ER Diyagramı:** Tablolar arası ilişkilerin (Users, Questions, Categories) dökümantasyonu.

### 🎨 **Dev 2: UI/UX & Product Analyst**
* **Wireframe:** Sayfa iskeletlerinin (Home, Student, Admin) düşük sadakatli çizimi.
* **User Flow:** Kullanıcı deneyimi yolculuğunun (User Journey) analizi.
* **API Contract:** Frontend-Backend arası JSON veri şemalarının belirlenmesi.

### 🐳 **Dev 3: DevOps & Infrastructure**
* **Containerization:** Multi-container yapısının Dockerize edilmesi.
* **Orkestrasyon:** `docker-compose.yml` ile servislerin izole ve güvenli bağlanması.
* **Environment:** Ortam değişkenlerinin (`.env`) ve güvenlik konfigürasyonlarının yönetimi.

---

