# Node 20, modern Vite ve React projeleri için en stabil sürümdür
FROM node:24-alpine

# Uygulama dizini
WORKDIR /app

# Cache mekanizmasını tetiklemek için önce sadece paket dosyalarını kopyalıyoruz
# Bu sayede sadece yeni kütüphane eklediğinde 'npm install' uzun sürer
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Projenin geri kalanını kopyala
COPY . .

# Vite'in 5173 portunu dış dünyaya aç
EXPOSE 5173

# Vite'in Docker konteynerı dışından erişilebilir olması için --host 0.0.0.0 şarttır
# Ayrıca 'watch' mekanizmasının bazı sistemlerde çalışması için --polling gerekebilir
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]