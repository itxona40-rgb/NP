# IT Live — Noutbuk nazorati (server varianti)

Bitta serverda ishlaydi: barcha telefon va kompyuterlar **bir xil ma’lumotni** ko‘radi.
Qo‘shimcha kutubxona kerak emas, faqat **Node.js 18 yoki yangiroq**.

## Ishga tushirish
```
cd ITLive-server
node server.js
```
Brauzerda oching: `http://SERVER_MANZILI:3000`
Birinchi kirish: login `admin`, parol `admin123`. Kirgach **Sozlamalar → Login va parolni o‘zgartirish** orqali almashtiring.
(Boshlang‘ich qiymatni o‘zgartirish: `ADMIN_USER=nom ADMIN_PASS=parol node server.js`, faqat birinchi ishga tushishda.)

## Doimiy ishlashi uchun (Ubuntu server)
```
sudo npm i -g pm2
pm2 start server.js --name itlive
pm2 save && pm2 startup
```

## HTTPS (kamera skaneri uchun SHART)
Telefon brauzerida kamera faqat **https** manzilda ochiladi. Eng oson yo‘l — Caddy:
```
sudo apt install caddy
# /etc/caddy/Caddyfile
sayt.sizning-domen.uz {
    reverse_proxy localhost:3000
}
```
Keyin serverni `SECURE=1 node server.js` (yoki pm2 da shu o‘zgaruvchi bilan) ishga tushiring.
HTTPS bo‘lmasa ham telefonning oddiy kamerasi bilan QR skaner qilish ishlaydi (sayt ochiladi va noutbuk oynasi chiqadi), faqat saytning ichidagi “📷 Skaner” ishlamaydi.

## Ma’lumotlar
Hammasi `data/` papkasida: `state.json` (noutbuklar, tarix, hisobotlar), `auth.json` (login va shifrlangan parol).
**Zaxira:** shu papkani vaqti-vaqti bilan nusxalab qo‘ying.

## QR yorliqlar
QR kodlar saytni qaysi manzildan ochgan bo‘lsangiz, o‘sha manzilga bog‘lanadi.
Yakuniy manzil (domen) tayyor bo‘lgach saytning **QR** bo‘limini oching va yorliqlarni chop eting.
Manzil keyin o‘zgarsa, yorliqlarni qayta chop etish kerak.

## Eslatma
- Bir vaqtda ikki kishi bir xil ma’lumotni o‘zgartirsa, ikkinchisiga “Yangilandi, qayta bajaring” xabari chiqadi.
- Bitta mas’ul login. Parol serverda shifrlangan holda saqlanadi.
