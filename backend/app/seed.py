from sqlalchemy.orm import Session
from . import models, auth
from .database import SessionLocal


def run_seed():

    db = SessionLocal()
    
    try:

        
        users_data = [
            {
                "email": "admin@dpu.edu.tr",
                "full_name": "Sistem Yöneticisi",
                "password": "admin123",
                "role": models.UserRole.admin,
                "faculty": None,
                "department": None
            },
            {
                "email": "ogrenci@dpu.edu.tr",
                "full_name": "Ahmet Yılmaz",
                "password": "ogrenci123",
                "role": models.UserRole.student,
                "faculty": "Mühendislik Fakültesi",
                "department": "Bilgisayar Mühendisliği"
            },
            {
                "email": "ogrenci2@dpu.edu.tr",
                "full_name": "Ayşe Demir",
                "password": "ogrenci456",
                "role": models.UserRole.student,
                "faculty": "İktisadi ve İdari Bilimler Fakültesi",
                "department": "İşletme"
            }
        ]
        
        for user_data in users_data:
            existing = db.query(models.User).filter(
                models.User.email == user_data["email"]
            ).first()
            
            if not existing:
                new_user = models.User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=auth.get_password_hash(user_data["password"]),
                    role=user_data["role"],
                    faculty=user_data["faculty"],
                    department=user_data["department"],
                    is_active=True
                )
                db.add(new_user)
                print(f"✓ Kullanıcı eklendi: {user_data['email']}")
            else:
                print(f"⊘ Kullanıcı zaten mevcut: {user_data['email']}")
        
        
 
        
        categories_list = [
            "Kayıt İşlemleri",
            "Burslar",
            "Kütüphane",
            "Yemekhane",
            "Yurtlar",
            "Sınav Takvimi"
        ]
        
        for cat_name in categories_list:
            existing = db.query(models.Category).filter(
                models.Category.name == cat_name
            ).first()
            
            if not existing:
                new_cat = models.Category(name=cat_name)
                db.add(new_cat)
                print(f"✓ Kategori eklendi: {cat_name}")
            else:
                print(f"⊘ Kategori zaten mevcut: {cat_name}")
        
       
        db.commit()
        
        
      
        
        admin = db.query(models.User).filter(models.User.email == "admin@dpu.edu.tr").first()
        ogrenci = db.query(models.User).filter(models.User.email == "ogrenci@dpu.edu.tr").first()
        ogrenci2 = db.query(models.User).filter(models.User.email == "ogrenci2@dpu.edu.tr").first()
        
        cat_kayit = db.query(models.Category).filter(models.Category.name == "Kayıt İşlemleri").first()
        cat_burs = db.query(models.Category).filter(models.Category.name == "Burslar").first()
        cat_kutuphane = db.query(models.Category).filter(models.Category.name == "Kütüphane").first()
        cat_yemekhane = db.query(models.Category).filter(models.Category.name == "Yemekhane").first()
        cat_yurt = db.query(models.Category).filter(models.Category.name == "Yurtlar").first()
        cat_sinav = db.query(models.Category).filter(models.Category.name == "Sınav Takvimi").first()
        
        
      
        
        faq_questions = [
           
            {
                "question": "Ders kaydı ne zaman yapılır?",
                "answer": "Ders kayıtları her dönem başında akademik takvimde belirlenen tarihlerde yapılır. Öğrenci Bilgi Sistemi (ÖBS) üzerinden online olarak gerçekleştirilir.",
                "category": cat_kayit,
                "user": admin
            },
            {
                "question": "Ders ekle-sil işlemi nasıl yapılır?",
                "answer": "ÖBS'ye giriş yaparak 'Ders İşlemleri' menüsünden ders ekle-sil işlemlerini akademik takvimde belirtilen tarihlerde yapabilirsiniz.",
                "category": cat_kayit,
                "user": admin
            },
            {
                "question": "Kayıt dondurma işlemi nasıl yapılır?",
                "answer": "Kayıt dondurma başvurusu için fakülte öğrenci işlerine dilekçe ile başvurmanız gerekmektedir. Gerekli belgeler: sağlık raporu veya askere gitme belgesi.",
                "category": cat_kayit,
                "user": admin
            },
            
            
            {
                "question": "Başarı bursu nasıl alınır?",
                "answer": "Her dönem not ortalaması 3.00 ve üzeri olan öğrencilere başarı bursu verilir. Otomatik olarak hesabınıza yatırılır.",
                "category": cat_burs,
                "user": admin
            },
            {
                "question": "Burs başvuruları ne zaman yapılır?",
                "answer": "Burs başvuruları her akademik yılın başında Eylül-Ekim aylarında yapılır. ÖBS'den online başvuru yapabilirsiniz.",
                "category": cat_burs,
                "user": admin
            },
            {
                "question": "Hangi burs türleri var?",
                "answer": "Üniversitemizde başarı bursu, sosyal destek bursu ve engelli öğrenci bursu olmak üzere 3 tür burs bulunmaktadır.",
                "category": cat_burs,
                "user": admin
            },
            
           
            {
                "question": "Kütüphane çalışma saatleri nedir?",
                "answer": "Merkez kütüphane hafta içi 08:00-22:00, hafta sonu 09:00-18:00 saatleri arasında açıktır.",
                "category": cat_kutuphane,
                "user": admin
            },
            {
                "question": "Kitap ödünç alma süresi ne kadardır?",
                "answer": "Lisans öğrencileri en fazla 5 kitabı 15 gün süreyle ödünç alabilir. Uzatma işlemi 1 kez yapılabilir.",
                "category": cat_kutuphane,
                "user": admin
            },
            
           
            {
                "question": "Yemekhane çalışma saatleri nedir?",
                "answer": "Öğle yemeği: 11:30-14:00, Akşam yemeği: 17:30-19:30 saatleri arasında servis yapılmaktadır.",
                "category": cat_yemekhane,
                "user": admin
            },
            {
                "question": "Yemek kartı nasıl yüklenir?",
                "answer": "Yemek kartınıza ÖBS üzerinden kredi kartı ile veya kampüsteki PTT şubesinden nakit olarak yükleme yapabilirsiniz.",
                "category": cat_yemekhane,
                "user": admin
            },
            
            
            {
                "question": "Yurt başvuruları nasıl yapılır?",
                "answer": "Yurt başvuruları e-Devlet üzerinden KYK sistemi aracılığıyla yapılır. Başvuru dönemleri Temmuz-Ağustos aylarıdır.",
                "category": cat_yurt,
                "user": admin
            },
            {
                "question": "Özel yurt seçenekleri var mı?",
                "answer": "Üniversitemiz kampüsü çevresinde onaylı birçok özel yurt bulunmaktadır. Liste için Öğrenci İşleri Daire Başkanlığı'na başvurabilirsiniz.",
                "category": cat_yurt,
                "user": admin
            },
            
           
            {
                "question": "Vize sınavları ne zaman yapılır?",
                "answer": "Vize sınavları dönemin 7-8. haftalarında yapılır. Kesin tarihler akademik takvimde belirtilir ve ÖBS'de yayınlanır.",
                "category": cat_sinav,
                "user": admin
            },
            {
                "question": "Final sınavı mazeret hakkı var mı?",
                "answer": "Sağlık raporu veya zorunlu sebeplerle sınava giremeyenler için mazeret sınavı hakkı tanınır. Dilekçe ile başvuru yapılmalıdır.",
                "category": cat_sinav,
                "user": admin
            }
        ]
        
        for faq in faq_questions:
            existing = db.query(models.Question).filter(
                models.Question.question_text == faq["question"]
            ).first()
            
            if not existing:
                new_q = models.Question(
                    user_id=faq["user"].id,
                    category_id=faq["category"].id,
                    question_text=faq["question"],
                    answer_text=faq["answer"],
                    status=models.QuestionStatus.answered,
                    ai_checked=True,
                    ai_reject_reason=None,
                    answered_at=None  
                )
                db.add(new_q)
                print(f"✓ SSS eklendi: {faq['question'][:50]}...")
            else:
                print(f"⊘ SSS zaten mevcut: {faq['question'][:50]}...")
        
        
    
        
        pending_questions = [
            {
                "question": "Erasmus başvurusu için gerekli belgeler nelerdir?",
                "category": cat_kayit,
                "user": ogrenci
            },
            {
                "question": "Çift anadal programına nasıl başvurabilirim?",
                "category": cat_kayit,
                "user": ogrenci2
            },
            {
                "question": "Yurtdışı burs imkanları nelerdir?",
                "category": cat_burs,
                "user": ogrenci
            },
            {
                "question": "Mezuniyet için kaç kredi tamamlamam gerekir?",
                "category": cat_kayit,
                "user": ogrenci2
            },
            {
                "question": "Kütüphanede grup çalışma odası rezervasyonu nasıl yapılır?",
                "category": cat_kutuphane,
                "user": ogrenci
            },
            {
                "question": "Staj zorunluluğu var mı?",
                "category": cat_kayit,
                "user": ogrenci2
            },
            {
                "question": "Yemekhane menüsüne nereden ulaşabilirim?",
                "category": cat_yemekhane,
                "user": ogrenci
            },
            {
                "question": "Bütünleme sınavları ne zaman yapılır?",
                "category": cat_sinav,
                "user": ogrenci2
            }
        ]
        
        for pend in pending_questions:
            existing = db.query(models.Question).filter(
                models.Question.question_text == pend["question"]
            ).first()
            
            if not existing:
                new_q = models.Question(
                    user_id=pend["user"].id,
                    category_id=pend["category"].id,
                    question_text=pend["question"],
                    answer_text=None,
                    status=models.QuestionStatus.pending,
                    ai_checked=True,  
                    ai_reject_reason=None
                )
                db.add(new_q)
                print(f"✓ Bekleyen soru eklendi: {pend['question'][:50]}...")
            else:
                print(f"⊘ Bekleyen soru zaten mevcut: {pend['question'][:50]}...")
        
        
      
        db.commit()
        print("\n Seed işlemi başarıyla tamamlandı!")
        
    except Exception as e:
        db.rollback()
        print(f"\nSeed sırasında hata oluştu: {e}")
        raise  
        
    finally:
        db.close()