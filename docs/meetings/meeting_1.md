# Toplantı Tutanağı - 1: Proje Başlangıcı ve Altyapı Kurulumu

**Tarih:** 12 Nisan 2026  
**Katılımcılar:** Kübra, Zeynep, Raghad  
**Konu:** Initial project setup, Backend Klasör Yapısı ve Temel Modellerin Belirlenmesi

## Gündem Maddeleri
1. **Geliştirme Ortamı:** Projenin React (Vite) ile frontend, FastAPI ile backend tarafının ayağa kaldırılması.
2. **Veritabanı Tasarımı:** Hangi tabloların olacağı ve SQLAlchemy modellerinin nasıl tasarlanacağı.

## Toplantı Notları ve Alınan Kararlar
1. **Frontend Altyapısının Kurulması:** React ve Vite kullanılarak frontend projesinin başlatıldığı, Tailwind CSS yapılandırmasının başarıyla tamamlandığı bildirilmiştir. Bu doğrultuda ilgili görev (#1) kapatılmıştır.
2. **Backend Mimarisi:** FastAPI tabanlı backend altyapısının oluşturulduğu; `routers`, `models` ve `schemas` klasör dizinlerinin yapılandırıldığı belirtilmiştir.
3. **Veritabanı Şemaları:** PostgreSQL veritabanı bağlantılarının test edildiği ve sistemin temelini oluşturacak olan `User`, `Category` ve `Question` tablolarının SQLAlchemy modelleri olarak tanımlandığı raporlanmıştır.
4. **Veri Doğrulama (Pydantic):** Gelen istekler (Create) ve dönen yanıtlar (Response/Out) için Pydantic şemalarının birbirinden ayrı tutulmasına, böylece API güvenliğinin ve veri bütünlüğünün sağlanmasına karar verilmiştir.
5. **Sonraki Adımlar:** Bir sonraki geliştirme aşamasında kimlik doğrulama (Authentication) işlemlerine başlanması kararlaştırılmıştır.

**Kapatılan Issue'lar:** 
- Initial project setup (#1)
- [TASK-4] Backend Klasör Yapısı, Modeller ve Şemalar (#6)
