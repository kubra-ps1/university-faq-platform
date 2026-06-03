

import os
import json
import logging
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

def _get_model():
    return model



class ModerationResult(BaseModel):
    isAppropriate: bool = Field(description="True if the question is appropriate, False otherwise.")
    reason: str | None = Field(description="Reason for rejection if inappropriate, else null.")


class AdminPreparationResult(BaseModel):
    normalizedQuestion: str = Field(description="The normalized, formal version of the question.")
    suggestedCategory: str = Field(description="The name of the suggested category (from the provided list, or a completely new one if none fit).")
    isNewCategory: bool = Field(description="True if the suggestedCategory is NOT in the provided list.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0.")




async def moderate_question(question_text: str) -> dict[str, Any]:

    m = _get_model()
    if m is None:
        logger.warning("GEMINI_API_KEY bulunamadı, moderasyon atlanıyor.")
        return {"isAppropriate": True, "reason": None}

    
    blacklist = ["salak", "aptal", "saçma", "aq", "pedofili", "siyaset", "parti", "boş iş", "gerizekalı"]
    lower_q = question_text.lower()
    if any(word in lower_q for word in blacklist):
        return {"isAppropriate": False, "reason": "İçerik güvenlik politikalarımıza uymadığı için engellendi (Uygunsuz İfade)."}

    prompt = (
        f"Sen bir üniversitenin resmi SSS (Sıkça Sorulan Sorular) platformu için çok katı bir içerik moderatörüsün. Görevin, öğrencinin metnini sadece kelime bazında değil; bağlam, üslup ve niyet açısından analiz etmektir.\n\n"
        f"Öğrencinin metni: '{question_text}'\n\n"
        "Aşağıdaki durumlardan HERHANGİ BİRİ geçerliyse metni KESİNLİKLE REDDET (isAppropriate: false):\n"
        "1. LAUBALİ VE RESMİ OLMAYAN ÜSLUP: Kelime bazında küfür olmasa bile; ciddiyetsiz, lakayt, saygısız, alaycı, kaba veya kurumsal bir ortama uymayan ('boş iş', 'salak', 'saçma' gibi imalar taşıyan) her türlü soru.\n"
        "2. ETİK VE AHLAK DIŞI BAĞLAM: Kelimeler doğrudan geçmese bile; ima yoluyla cinsellik, pedofili, yasadışı eylem, şiddet, zorbalık veya ahlaka aykırı herhangi bir durum barındıran örtülü veya açık mesajlar.\n"
        "3. SİYASİ İÇERİK: Direkt siyasi isim geçmese bile; herhangi bir ideolojik tartışmaya, hükumet/muhalefet eleştirisine veya politik kutuplaşmaya yol açabilecek içerikler.\n"
        "4. KÜFÜR VE HAKARET: Doğrudan veya gizlenmiş (argo/harf oyunları ile) kurumları, kişileri aşağılayan ifadeler.\n"
        "5. TROLLEME: 'asdasdas' gibi anlamsız, spam veya platformu meşgul etme amaçlı sorular.\n\n"
        "ÖNEMLİ KURAL: Öğrencinin sorusu SADECE VE SADECE temiz, ahlaklı, üniversite ile ilgili, resmi ve saygılı bir bilgi alma amacı taşıyorsa 'isAppropriate: true' yap. Aksi en ufak bir şüphede (laubalilik veya ahlaki uygunsuzluk sezdiğinde) KESİNLİKLE reddet ve 'reason' alanına 'Sorunuz kurumsal ciddiyete, etik kurallara veya içerik politikamıza uymadığı için reddedilmiştir.' yaz."
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
            logger.warning("Gemini API kota limiti doldu (429). Güvenlik nedeniyle reddedildi.")
            return {"isAppropriate": False, "reason": "AI sistemi şu an meşgul. Lütfen biraz sonra tekrar deneyiniz."}
        logger.error("Moderasyon API hatası: %s", exc)

    
    return {"isAppropriate": False, "reason": "AI sistemi şu an geçici bir hata yaşıyor. Lütfen tekrar deneyiniz."}




async def prepare_for_admin(raw_text: str, available_categories: list[str]) -> dict[str, Any]:

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
        "Sen bir Üniversite SSS platformu içerik yöneticisisin. Aşağıdaki görevleri DİKKATLİCE yap.\n"
        f"Ham soru: '{raw_text}'\n"
        f"Mevcut kategoriler: {cats_str}\n\n"
        "GÖREV 1 - normalizedQuestion: DİKKAT: Cümledeki BÜTÜN yazım yanlışlarını (girmk -> girmek, basvuri -> başvuru vb.) düzelt. Sadece soru işareti ekleyip bırakma. Tamamen Türkçe dilbilgisine uygun, çok resmi ve kurumsal bir SSS formatına çevir. (Örn: 'yatay geçiş nası yapılıyo' -> 'Yatay geçiş başvuruları nasıl yapılır?')\n"
        "GÖREV 2 - suggestedCategory: Mevcut kategorilerden en uygunu varsa o kategorinin birebir aynı ismini yaz. Hiçbiri uymuyorsa 1-2 kelimelik yeni bir kategori ismi türet.\n"
        "GÖREV 3 - isNewCategory: SADECE yeni kategori türettiysen true, mevcut kategorilerden birini seçtiysen false.\n"
        "GÖREV 4 - confidence: Kategoriye güvenin 0.0-1.0 arası bir sayı olarak.\n"
        "SADECE JSON FORMATINDA CEVAP VER."
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




import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

class GeminiEmbeddingFunction(EmbeddingFunction):

    def __call__(self, input: Documents) -> Embeddings:
        if not input: return []
        try:
            response = genai.embed_content(
                model="models/gemini-embedding-001",
                content=list(input),
                task_type="retrieval_document"
            )
            
            return response['embedding']
        except Exception as exc:
            logger.error("Gemini Embedding hatası: %s", exc)
           
            return [[0.0] * 3072 for _ in input]

try:
    
    chroma_client = chromadb.PersistentClient(path="./chroma_db")

   
    ef = GeminiEmbeddingFunction()

   
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
        pass


def semantic_search(query: str, questions: list[dict]) -> dict[str, Any]:

    if not questions:
        return {"scenario": 3, "type": "none", "data": []}

    if not collection:
        logger.warning("ChromaDB collection tanımlı değil. Fallback kullanılıyor.")
        return _fallback_search(query, questions)

    try:
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

       
        valid_matches = []
        for i, dist in enumerate(best_distances):
            status = best_metadatas[i]["status"]
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

       
        best_match = valid_matches[0]

        if best_match["status"] == "answered":
           
            answered_ids = [m["id"] for m in valid_matches if m["status"] == "answered"]
            matched = [q for q in questions if q["id"] in answered_ids]
            return {"scenario": 1, "type": "directAnswer", "data": matched}
        else:
        
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
