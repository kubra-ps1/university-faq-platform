# Hafif ve hızlı bir Python imajı kullanıyoruz
FROM python:3.11-slim

RUN adduser --disabled-password --gecos "" appuser
# Uygulama dizinini oluştur
WORKDIR /app
RUN chown appuser:appuser /app

# Bağımlılıkları kopyala ve kur
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY --chown=appuser:appuser . .
USER appuser

# FastAPI'yi başlat (0.0.0.0 dış erişim için şart, --reload geliştirme için)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]