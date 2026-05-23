"""
ai_service.py — Tüm Gemini çağrılarını merkezileştirir.

İstasyonlar:
  1. moderate_question()      → İçerik moderasyonu (hakaret/spam kontrolü)
  2. prepare_for_admin()      → Soru normalizasyonu + kategori önerisi
  3. semantic_search()        → Senaryo 1/2/3 anlamsal arama
"""

import os
import json
import logging
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# .env dosyasındaki değişkenleri sisteme yükler
load_dotenv()

# API Anahtarını al ve yapılandır
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # gemini-2.5-flash: farklı kota havuzu, ücretsiz tier'da daha cömert
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

def _get_model():
    return model


# Pydantic Schema for Moderation
class ModerationResult(BaseModel):
    isAppropriate: bool = Field(description="True if the question is appropriate, False otherwise.")
    reason: str | None = Field(description="Reason for rejection if inappropriate, else null.")

# Pydantic Schema for Admin Prep
class AdminPreparationResult(BaseModel):
    normalizedQuestion: str = Field(description="The normalized, formal version of the question.")
    suggestedCategory: str = Field(description="The name of the suggested category (from the provided list, or a completely new one if none fit).")
    isNewCategory: bool = Field(description="True if the suggestedCategory is NOT in the provided list.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0.")


# ── 1. İçerik Moderasyonu ───────────────────────────────────────────────────

async def moderate_question(question_text: str) -> dict[str, Any]:
    """
    Soruyu içerik politikasına göre denetler. Asenkron çalışır.

    Dönüş:
        {
            "isAppropriate": bool,
            "reason": str | None   # Sadece uygunsuzsa doldurulur
        }
    Fallback (API hatası): {"isAppropriate": True, "reason": None}
    """
    m = _get_model()
    if m is None:
        # API anahtarı yoksa moderasyonu atla (geliştirme modu)
        logger.warning("GEMINI_API_KEY bulunamadı, moderasyon atlanıyor.")
        return {"isAppropriate": True, "reason": None}

    prompt = (
        f"Aşağıdaki soruyu bir üniversite SSS platformu içerik politikalarına göre denetle: '{question_text}'.\n\n"
        "KURALLAR:\n"
        "1. İçerikte KESİNLİKLE küfür, argo, hakaret, aşağılayıcı dil, nefret söylemi, spam veya kişisel veri ihlali varsa 'isAppropriate: false' döndür ve 'reason' alanına Türkçe olarak 'İçerik güvenlik politikalarımıza uymadığı için engellendi (Küfür/Hakaret vb.).' yaz.\n"
        "2. Üniversite ortamına uygun olmayan her türlü absürt veya anlamsız (asdadasd gibi) soruyu reddet.\n"
        "3. Kategori ataması YAPMA."
    )

    try:
        response = await m.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ModerationResult,
            )
        )
        result = json.loads(response.text)
        return {
            "isAppropriate": bool(result.get("isAppropriate", True)),
            "reason": result.get("reason"),
        }
    except Exception as exc:
        err_str = str(exc).lower()
        if "safety" in err_str or "finish_reason: safety" in err_str:
            logger.warning("Gemini Safety Block tetiklendi.")
            return {"isAppropriate": False, "reason": "İçerik güvenlik politikalarımıza uymadığı için engellendi (Küfür/Argo tespit edildi)."}
        if "429" in err_str or "resource_exhausted" in err_str or "too many requests" in err_str or "quota" in err_str:
            logger.warning("Gemini API kota limiti doldu (429). Moderasyon atlanıyor, soru onaylı sayılıyor.")
            return {"isAppropriate": True, "reason": None}
        logger.error("Moderasyon API hatası: %s", exc)

    # Geçici ağ hatası vb. durumlarda sistemi kitlememek için onaylı sayılır
    return {"isAppropriate": True, "reason": None}


# ── 2. Admin Normalize + Kategori Önerisi ───────────────────────────────────

async def prepare_for_admin(raw_text: str, available_categories: list[str]) -> dict[str, Any]:
    """
    Ham öğrenci sorusunu resmi SSS formatına normalize eder ve
    mevcut kategorilerden biri için öneri üretir. Asenkron çalışır.
    """
    m = _get_model()
    cats_str = ", ".join(available_categories) if available_categories else "Diğer"

    fallback_response = {
        "normalizedQuestion": "",   # boş bırak — frontend'de admin doldursun
        "suggestedCategory": available_categories[0] if available_categories else "Diğer",
        "isNewCategory": False,
        "confidence": 0.0,
    }

    if m is None:
        logger.warning("GEMINI_API_KEY bulunamadı, normalize atlanıyor.")
        return fallback_response

    prompt = (
        "Sen bir Üniversite SSS platformu içerik yöneticisisin. Aşağıdaki görevleri yap.\n"
        f"Ham soru: '{raw_text}'\n"
        f"Mevcut kategoriler: {cats_str}\n\n"
        "GÖREV 1 - normalizedQuestion: Ham soruyu yazım hatalarını düzelterek, profesyonel ve resmi SSS formatına çevir. Kesinlikle ham halini bırakma. (Örn: 'yatay geçiş nası yapılıyo' -> 'Yatay geçiş başvuruları nasıl yapılır?')\n"
        "GÖREV 2 - suggestedCategory: Mevcut kategorilerden en uygunu varsa o kategorinin birebir aynı ismini yaz. Hiçbiri uymuyorsa 1-2 kelimelik yeni bir kategori ismi türet.\n"
        "GÖREV 3 - isNewCategory: SADECE yeni kategori türettiysen true, mevcut kategorilerden birini seçtiysen false.\n"
        "GÖREV 4 - confidence: Kategoriye güvenin 0.0-1.0 arası bir sayı olarak.\n"
        "Taslak cevap üretme."
    )

    try:
        response = await m.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AdminPreparationResult,   # ← camelCase field adlarını garanti eder
            )
        )
        
        resp_text = response.text.strip()
        logger.info("Gemini prepare raw response: %s", resp_text)
        
        # Olası markdown bloklarını temizle
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:]
        if resp_text.startswith("```"):
            resp_text = resp_text[3:]
        if resp_text.endswith("```"):
            resp_text = resp_text[:-3]
            
        result = json.loads(resp_text.strip())
        logger.info("Gemini prepare parsed: %s", result)
        
        suggested = str(result.get("suggestedCategory", "")).strip()
        is_new = bool(result.get("isNewCategory", False))
        
        # Yapay zeka mevcut kategoriden biri seçildiyse isNewCategory'yi düzelt
        if suggested in available_categories:
            is_new = False
        elif suggested:
            is_new = True
            
        normalized = str(result.get("normalizedQuestion", "")).strip()   # default boş — orijinali dönme
        confidence = float(result.get("confidence", 0.9))

        return {
            "normalizedQuestion": normalized,
            "suggestedCategory": suggested,
            "isNewCategory": is_new,
            "confidence": confidence,
        }
    except Exception as exc:
        import traceback
        err_str = str(exc).lower()
        if "429" in err_str or "resource_exhausted" in err_str or "too many requests" in err_str or "quota" in err_str:
            logger.warning("Gemini API kota limiti doldu (429). Admin prepare fallback kullanılıyor.")
        else:
            logger.error("Admin prepare API hatası (traceback):\n%s", traceback.format_exc())

    return fallback_response


# ── 3. Semantik Arama (Senaryo 1 / 2 / 3) ──────────────────────────────────

import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

class GeminiEmbeddingFunction(EmbeddingFunction):
    """
    Google Gemini's text-embedding-004 model for highly accurate,
    contextual multilingual (Turkish) semantic search.
    """
    def __call__(self, input: Documents) -> Embeddings:
        if not input: return []
        try:
            response = genai.embed_content(
                model="models/gemini-embedding-001",
                content=list(input),
                task_type="retrieval_document"
            )
            # Response['embedding'] is a list of embeddings
            return response['embedding']
        except Exception as exc:
            logger.error("Gemini Embedding hatası: %s", exc)
            # Return zero vectors as fallback (3072 is gemini-embedding-001 dimension)
            return [[0.0] * 3072 for _ in input]

try:
    # ChromaDB kurulumu
    chroma_client = chromadb.PersistentClient(path="./chroma_db")

    # Gemini bazlı Embedding fonksiyonu
    ef = GeminiEmbeddingFunction()

    # Model boyutları ve vektör uzayı değiştiği için yeni collection oluşturduk:
    collection = chroma_client.get_or_create_collection(
        name="faq_questions_gemini_v2", 
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )
except Exception as e:
    logger.error("ChromaDB başlatılamadı: %s", e)
    collection = None


def upsert_question(question_id: int, text: str, status: str):
    """Soru veritabanına eklendiğinde veya güncellendiğinde ChromaDB'ye kaydeder."""
    if collection is None:
        return
    try:
        collection.upsert(
            ids=[str(question_id)],
            documents=[text],
            metadatas=[{"status": status}]
        )
    except Exception as exc:
        logger.error("ChromaDB upsert hatası (ID: %s): %s", question_id, exc)


def delete_question_from_db(question_id: int):
    """Soru veritabanından silindiğinde ChromaDB'den de siler."""
    if collection is None:
        return
    try:
        collection.delete(ids=[str(question_id)])
    except Exception as exc:
        # Silinecek ID yoksa hata fırlatabilir, yoksay
        pass


def semantic_search(query: str, questions: list[dict]) -> dict[str, Any]:
    """
    Kullanıcı sorgusunu ChromaDB kullanarak anlamsal (vektörel) olarak karşılaştırır.
    En yakın geçerli sonucun statüsüne göre Senaryo 1 (answered) veya Senaryo 2 (pending) belirler.
    """
    if not questions:
        return {"scenario": 3, "type": "none", "data": []}

    if not collection:
        logger.warning("ChromaDB collection tanımlı değil. Fallback kullanılıyor.")
        return _fallback_search(query, questions)

    try:
        # Sorguyu vektör veritabanında ara:
        results = collection.query(
            query_texts=[query],
            n_results=min(3, len(questions)),
            include=["distances", "metadatas", "documents"]
        )

        if not results["distances"] or not results["distances"][0]:
            return {"scenario": 3, "type": "none", "data": []}

        best_distances = results["distances"][0]
        best_metadatas = results["metadatas"][0]
        best_ids       = results["ids"][0]

        # Geçerli (eşik değerinin altındaki) tüm eşleşmeleri topla
        valid_matches = []
        for i, dist in enumerate(best_distances):
            status = best_metadatas[i]["status"]
            # Türkçe bağlamsal aramalarda en isabetli eşik değerleri:
            # Answered için < 0.40, Pending için < 0.45
            is_valid_answered = (status == "answered" and dist < 0.40)
            is_valid_pending = (status == "pending" and dist < 0.45)

            if is_valid_answered or is_valid_pending:
                valid_matches.append({
                    "id": int(best_ids[i]),
                    "status": status,
                    "distance": dist
                })

        if not valid_matches:
            return {"scenario": 3, "type": "none", "data": []}

        # ChromaDB sonuçları zaten en yakın mesafeden en uzağa sıralı getirir.
        # Bu yüzden ilk eleman en yakın geçerli eşleşmedir.
        best_match = valid_matches[0]

        if best_match["status"] == "answered":
            # En yakın eşleşme answered ise Senaryo 1: Direkt Cevap
            # Sadece answered olan geçerli eşleşmeleri döndür
            answered_ids = [m["id"] for m in valid_matches if m["status"] == "answered"]
            matched = [q for q in questions if q["id"] in answered_ids]
            return {"scenario": 1, "type": "directAnswer", "data": matched}
        else:
            # En yakın eşleşme pending ise Senaryo 2: "Bunu mu demek istediniz?"
            # Sadece pending olan geçerli eşleşmeleri döndür
            pending_ids = [m["id"] for m in valid_matches if m["status"] == "pending"]
            matched = [q for q in questions if q["id"] in pending_ids]
            return {"scenario": 2, "type": "similar", "data": matched}

    except Exception as exc:
        logger.error("ChromaDB Semantik arama hatası: %s", exc)
        return _fallback_search(query, questions)


def _fallback_search(query: str, questions: list[dict]) -> dict[str, Any]:
    """API hatası durumunda basit metin içinde arama."""
    lower_q = query.lower()
    answered = [
        q for q in questions
        if q["status"] == "answered"
        and lower_q in q["question_text"].lower()
    ]
    if answered:
        return {"scenario": 1, "type": "directAnswer", "data": answered[:3]}

    pending = [
        q for q in questions
        if q["status"] == "pending"
        and lower_q in q["question_text"].lower()
    ]
    if pending:
        return {"scenario": 2, "type": "similar", "data": pending[:3]}

    return {"scenario": 3, "type": "none", "data": []}
