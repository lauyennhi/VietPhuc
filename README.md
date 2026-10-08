# Vstyle · Việt phục Remix

**AI Stylist phối Việt phục theo gu Gen Z — đúng bản sắc, vừa với mọi cơ thể.**
Bài dự thi vòng Audition **AI Arena: Viet Nam 2026** — đề *"Việt phục Remix: phối trang phục truyền thống theo phong cách Gen Z"*.

> Kể dịp của bạn bằng một câu ("chụp kỷ yếu ở Văn Miếu, trời nắng, thích Remix Gen Z"), Vstyle dùng **Gemini** để hiểu yêu cầu, đọc ảnh cảm hứng, xếp hạng bản phối, viết lời bình và vẽ ảnh minh họa — còn **bộ quy tắc văn hóa có nguồn thẩm định** đảm bảo không bản phối nào làm sai lệch đặc trưng Việt phục.

---

## 1. Đáp ứng đề bài

| Yêu cầu của đề | Vstyle làm gì |
|---|---|
| Chọn loại trang phục hoặc sự kiện | 8 loại Việt phục đã duyệt (Áo Ngũ Thân, Áo Tấc, Nhật Bình, Tứ Thân, Giao Lĩnh, Đối Khâm, Áo Dài, Ngũ Thân cách tân) · 8 dịp (Tết, tốt nghiệp, kỷ yếu, đám cưới, lễ hội, hòa nhạc, triển lãm, dạo phố) |
| Chọn màu sắc, phụ kiện, phong cách | Bảng màu lấy từ dữ liệu y phục, 16 phụ kiện chỉ hiện khi tương thích y phục + dịp, 6 phong cách |
| Xem kết quả dạng hình ảnh / thẻ gợi ý / mockup | Mockup vector theo từng kết cấu áo · thẻ gợi ý có dấu "triện son" chấm Chuẩn · **ảnh AI do Gemini vẽ** |
| Đọc thông tin nguồn gốc / ý nghĩa | Bách khoa y phục: ý nghĩa, đặc trưng kết cấu, quy tắc không được làm sai, nguồn khảo cứu |
| *Bổ sung:* tải ảnh hoặc chọn nhân vật | 5 nhân vật đại diện (có tư thế xe lăn) + 5 tông da · **tải ảnh cảm hứng → Gemini đọc bảng màu** · tùy chọn dùng ảnh của mình làm người mẫu khi tạo ảnh AI (cần đồng ý) |
| *Bổ sung:* gợi ý theo thời tiết & sự kiện | Bộ gợi ý tất định chấm điểm theo dịp, thời tiết, phong cách, màu, phụ kiện, nhu cầu thích ứng → Gemini xếp hạng top 3 |
| *Bổ sung:* kiểm tra hài hòa màu | Thẻ **Hài hòa màu sắc**: quan hệ màu (đơn sắc, tương đồng, bổ túc…), độ tương phản, số điểm nhấn, đối chiếu gợi ý màu của dịp |
| *Bổ sung:* so sánh phương án | So sánh 2 bản phối bất kỳ (hiện tại, gợi ý, lookbook) theo Chuẩn · Chất · Màu |
| *Bổ sung:* tạo & chia sẻ lookbook | Lưu Lookbook, link chia sẻ mở lại đúng bản phối, caption do Gemini viết, tải ảnh PNG |
| *Bổ sung:* cảnh báo sai lệch văn hóa | Rule engine có nguồn: vạt hữu nhậm, kết cấu ngũ thân, yếm với áo tứ thân, màu kiêng dịp hỷ… → KEEP / CONSIDER / WARNING |
| Bảo đảm thông tin văn hóa phù hợp | Xem mục 4 — Gemini **không bao giờ** tạo luật hay sử liệu; chỉ diễn giải kết quả đã kiểm chứng |

Điểm khác biệt: **may đo thích ứng** (xe lăn, hạn chế vận động tay, da nhạy cảm…) với thông số đã xác thực — "vừa với mọi cơ thể".

## 2. Chạy thử trong 3 phút

Yêu cầu: Node.js ≥ 20.11.

```bash
npm install
cp .env.example .env       # điền GEMINI_API_KEY (không có khóa app vẫn chạy ở chế độ dự phòng)
npm run dev                # http://localhost:3000
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Server Express + Vite (HMR) |
| `npm run build` | Build frontend vào `dist/` |
| `npm start` | Chạy production (`NODE_ENV=production` để phục vụ `dist/`) |
| `npm run lint` | Kiểm tra kiểu TypeScript |
| `npm test` | 194 bài test (dữ liệu, rule engine, gợi ý, mockup, Gemini giả lập, tính năng AI) |
| `npm run check` | lint + test + build |

## 3. Kiến trúc

```
Trình duyệt (React 19 + Tailwind 4)
  │  câu mô tả · ảnh cảm hứng (đã thu nhỏ, xóa EXIF) · lựa chọn thủ công
  ▼
Express server (server.ts) — giữ GEMINI_API_KEY, giới hạn tần suất, kiểm tra mọi ID
  ├─ /api/gemini/parse      Gemini ▸ câu tự nhiên → ID (JSON schema enum = allow-list)
  ├─ /api/gemini/recommend  Bộ gợi ý tất định ▸ ứng viên đã qua rule engine → Gemini xếp hạng
  ├─ /api/gemini/explain    Gemini ▸ lời bình dựa trên kết quả văn hóa bất biến
  ├─ /api/gemini/caption    Gemini ▸ caption mạng xã hội
  ├─ /api/gemini/vision     Gemini ▸ đọc ảnh → bảng màu → khớp màu Việt phục đã duyệt (ΔE Lab)
  └─ /api/gemini/render     Gemini (Nano Banana) ▸ ảnh minh họa từ prompt dựng bằng dữ liệu đã xác thực
  ▼
Dữ liệu tri thức (data/*.json, validate bằng zod + kiểm tra toàn vẹn quan hệ)
  y phục · phụ kiện · dịp · thời tiết · luật văn hóa · nguồn thẩm định · điều chỉnh thích ứng
```

- **Gemini API** qua `@google/genai` ≥ 2.24 (Interactions API). Model mặc định: `gemini-3.8-flash` (văn bản, ảnh đầu vào), `gemini-3.1-flash-image` (tạo ảnh); tự thử model dự phòng nếu model chính không khả dụng. Đổi bằng biến môi trường (xem `.env.example`).
- **Không có khóa hoặc Gemini lỗi** → mọi tính năng vẫn chạy: nhận diện câu theo từ khóa, xếp hạng tất định, lời bình lấy từ dữ liệu. Giao diện ghi rõ đang ở chế độ dự phòng.
- `store: false` cho mọi lời gọi Gemini; ảnh người dùng không lưu trên server.
- Giới hạn tần suất theo IP (văn bản 40/phút, đọc ảnh 8/phút, tạo ảnh 12/giờ + trần toàn cục) để bảo vệ hạn mức khi chia sẻ app.

## 4. Gemini được dùng thế nào & giữ đúng văn hóa ra sao

1. **Gemini hiểu, dữ liệu quyết định.** Gemini chỉ được chọn giá trị trong allow-list do server tạo từ dữ liệu đã duyệt (JSON schema dạng `enum`, có `NONE` khi không chắc); server kiểm tra lại mọi ID.
2. **Luật văn hóa là tất định.** Rule engine chấm điểm Chuẩn từ luật có nguồn; Gemini nhận kết quả như "sự thật bất biến" và bị cấm thêm sử liệu/luật mới.
3. **Không suy diễn về cơ thể.** Nhu cầu thích ứng chỉ lấy khi người dùng tự nói; khi đọc ảnh, Gemini chỉ mô tả trang phục và màu, không bình luận vóc dáng, khuôn mặt, tuổi, giới tính, sắc tộc.
4. **Ảnh AI có checklist.** Prompt tạo ảnh chèn nguyên văn đặc trưng kết cấu + quy tắc không được làm sai (vạt hữu nhậm…); giao diện hiện checklist để người dùng đối chiếu, ghi rõ "ảnh minh họa AI, có SynthID".
5. **Luôn có đường lui.** Mọi lỗi (hết hạn mức, sai JSON, timeout) đều rơi về kết quả tất định; output quá dài được cắt thay vì bỏ.

## 5. Deploy lên Google AI Studio (ai.studio)

1. Vào [aistudio.google.com](https://aistudio.google.com) → **Build**.
2. Trong ô prompt bấm **+ → Import from GitHub**, chọn repo này và **nhánh `vstyle-v2-ai-arena`** (mã nguồn nằm ở thư mục gốc repo để AI Studio nhận đúng `package.json`).
3. **Settings → Secrets**: đảm bảo có `GEMINI_API_KEY` (AI Studio thường tự cấu hình cho app dùng Gemini). Tùy chọn thêm `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`…
4. Chạy thử trong khung Preview: ô "Chế độ dự phòng" phải chuyển thành **"Gemini đang bật"**.
5. Bấm **Deploy / Publish** (Cloud Run). Có thể đặt URL dạng `https://ten-app.ai.studio` để nộp cho Ban giám khảo.
6. Kiểm tra nhanh sau deploy: mở `/api/health` → `hasGeminiKey: true`, `features.imageRender: true`.

> Lưu ý: khi chia sẻ app, lượt gọi Gemini tính vào hạn mức của chủ app. Tạo ảnh có thể cần tài khoản có quyền dùng model ảnh; nếu không, app vẫn hiển thị mockup vector và thông báo rõ ràng.

## 6. Cấu trúc thư mục

```
server.ts                  Express + Vite middleware, health check, bảo mật cơ bản
src/App.tsx                Luồng AI Stylist 1 câu + hành trình 9 bước + màn Kết quả
src/components/            UI (AiStylistComposer, PhotoInspirationCard, AiRenderPanel, ColorHarmonyCard, CompareView…)
src/lib/gemini/            provider (Interactions API), service (prompt + schema), routes, client
src/lib/culture/           Rule engine văn hóa tất định
src/lib/recommendation/    Bộ gợi ý tất định + bản đồ từ khóa dự phòng
src/lib/color/             Toán màu (Lab ΔE, WCAG contrast) + kiểm tra hài hòa
data/                      Cơ sở tri thức (JSON) — chỉ bản ghi APPROVED + có nguồn mới được dùng
tests/                     194 bài test, chạy bằng `npm test`
```

## 7. Tầm nhìn mở rộng

- **Hợp tác nhà may & cửa hàng cho thuê Việt phục:** mỗi bản phối xuất ra "phiếu may" (màu, phụ kiện, thông số thích ứng) để đặt may hoặc thuê đúng mẫu.
- **Mở rộng cơ sở tri thức cùng chuyên gia:** thêm y phục vùng miền, dân tộc thiểu số, triều đại khác — mỗi bản ghi phải có nguồn thẩm định trước khi được gợi ý.
- **Lookbook cộng đồng & trường học:** bảng màu đồng phục cho lớp chụp kỷ yếu, sự kiện văn hóa của trường, ngày hội Việt phục.
- **Thử đồ trực quan hơn:** ghép ảnh AI với ảnh người dùng theo thời gian thực, giữ nguyên checklist văn hóa để kiểm soát sai lệch.

## 8. Giới hạn đã biết

- Mockup vector mang tính minh họa kết cấu, không phải thử đồ thật; ảnh AI có thể sai chi tiết — thẻ Chuẩn văn hóa mới là kết quả chính thức.
- Cơ sở tri thức hiện có 8 loại áo đã duyệt; thêm y phục mới cần nguồn thẩm định trước khi đưa vào gợi ý.
- Lookbook lưu trên trình duyệt (localStorage).
