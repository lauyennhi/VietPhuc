# Vstyle · Việt phục Remix

**AI Stylist phối Việt phục theo gu Gen Z — đúng bản sắc, vừa với mọi cơ thể.**
Bài dự thi vòng Audition **AI Arena: Viet Nam 2026** — đề *"Việt phục Remix: phối trang phục truyền thống theo phong cách Gen Z"*.

> Kể dịp của bạn bằng một câu ("chụp kỷ yếu ở Văn Miếu, trời nắng, thích Remix Gen Z"), Vstyle dùng **Gemini** để hiểu yêu cầu, đọc ảnh cảm hứng, xếp hạng bản phối, viết lời bình và vẽ ảnh minh họa — còn **bộ quy tắc văn hóa có nguồn thẩm định** đảm bảo không bản phối nào làm sai lệch đặc trưng Việt phục.

---

## Luồng sử dụng (ít bước, mỗi trang một việc)

```
Trang chủ ── kể 1 câu ("kỷ yếu, hiện đại nhưng không mất chất") ──► Studio › AI tạo ──► Kết quả + Nhận xét
   │                                                                   │ Chỉnh tiếp
   ├── Khám phá ▾ ── Studio (AI tạo | Tự tạo) ◄────────────────────────┘
   │             ├── Adaptive Fashion: Tình trạng → Chọn áo → Kết quả (+ phiếu may đo)
   │             └── Phòng 3D · VR/AR
   ├── Kiến thức: Các loại Việt phục | Quiz
   └── Lookbook: Đã lưu | Bản nháp | Bảng tin (đăng bài, chia sẻ ảnh, so sánh)
```

- **AI tạo**: Gemini thiết kế **đúng theo câu mô tả** (y phục, màu — kể cả màu đặt may ngoài bảng màu, phụ kiện), rồi giải thích: *bạn yêu cầu → AI đáp ứng thế nào*, vì sao chọn, phụ kiện nên đi kèm, nên mang theo gì, mẹo mặc, điều cần tránh, 2 phương án khác. Không có khóa Gemini thì bộ phối tất định (`src/lib/design/designEngine.ts`) xử lý cùng câu đó.
- **Tự tạo**: trả lời 3 câu trắc nghiệm để có bản phối khởi đầu → chỉnh nhân vật (màu da, chiều cao, dáng, tóc, xe lăn), áo & màu (cả màu tự chọn), dáng áo bằng thanh trượt **hoặc kéo trực tiếp trên áo** (↕ dài tà, ✂ xẻ tà, ↔ rộng tay), phụ kiện tương thích.
- **Mọi luồng kết thúc bằng "Nhận xét & đánh giá"**: điểm Chuẩn văn hóa / Hợp dịp & gu / Hài hòa màu, nhận xét của AI, người dùng tự chấm sao + ghi chú, rồi Lưu Lookbook · Lưu nháp · Đăng bài · Chia sẻ.

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
| *Bổ sung:* **Virtual Tour · 3D · VR/AR** | **Phòng 3D & Tham quan ảo**: mô hình 3D bản phối (xoay 360°, vải gấm, dáng ngồi xe lăn) dựng từ dữ liệu y phục; tham quan 4 không gian (phòng trưng bày, Văn Miếu, Ngọ Môn Huế, làng quê Bắc Bộ) có điểm thông tin; vào **VR** bằng kính WebXR (Meta Quest…), **AR** trên Android, **AR Quick Look** trên iPhone (.usdz); tải **mô hình 3D .glb** |
| *Bổ sung:* **May đo thích ứng** | Xem mục "Điểm khác biệt" bên dưới: nhu cầu tự chọn, chỉnh rập Trước/Sau, kiểm tra Thích ứng × Bản sắc, phiếu may đo in PDF |
| *Bổ sung:* cảnh báo sai lệch văn hóa | Rule engine có nguồn: vạt hữu nhậm, kết cấu ngũ thân, yếm với áo tứ thân, màu kiêng dịp hỷ… → KEEP / CONSIDER / WARNING |
| Bảo đảm thông tin văn hóa phù hợp | Xem mục 4 — Gemini **không bao giờ** tạo luật hay sử liệu; chỉ diễn giải kết quả đã kiểm chứng |

### Điểm khác biệt: Adaptive Fashion — *vừa với mọi cơ thể, không đánh đổi bản sắc*

Người trẻ khuyết tật hoặc có nhu cầu đặc thù cũng muốn mặc Việt phục đi kỷ yếu, lễ hội, đám cưới — nhưng sửa áo tùy tiện dễ làm sai đặc trưng (cắt tay áo tấc, khoét cổ đứng, bỏ vạt hữu nhậm). Phòng **May đo thích ứng** giải quyết đúng mâu thuẫn đó:

| Bước | Trải nghiệm |
|---|---|
| 1. Tình trạng | 6 thẻ lớn do **người dùng tự chọn** (ngồi xe lăn, mặc bằng một tay, khó cài cúc, hạn chế cử động vai, khó đứng lâu, da nhạy cảm), chọn nhiều cùng lúc |
| 2. Chọn áo | 8 loại Việt phục kèm hình minh họa + màu |
| 3. Kết quả | **Trước / Sau** cạnh nhau, bản sau có chú thích ngay trên hình (−14 cm, nam châm ẩn, tay +3…); **Phối đồ dành riêng** cho từng tình trạng — phụ kiện nên mang (kèm lý do, bật/tắt trực tiếp trên hình) và *nên để ở nhà* (vd. xe lăn: túi đeo chéo, trâm thay nón rộng, bỏ dải thắt lưng dài; một tay: khăn đóng định hình sẵn, kiềng không khóa; da nhạy cảm: lụa, không kim loại); danh sách "Đã điều chỉnh cho bạn" (mỗi thay đổi kèm lý do); thẻ **Bản sắc được giữ** — rule engine cảnh báo khi điều chỉnh làm sai đặc trưng (cắt ống tay thụng, khoét cổ đứng, tà lễ phục quá ngắn, khóa kéo phá hai vạt song song…) và nút **Giữ bản sắc tự động**; hướng dẫn tự mặc; tinh chỉnh thêm & số đo (thu gọn); **Phiếu may đo** in/lưu PDF; lời khuyên AI; Xem 3D; Nhận xét & đánh giá |
| Xem 3D | Mở mô hình 3D dáng ngồi xe lăn trong Phòng 3D, xem bằng VR/AR |

Ứng dụng cũng **dễ tiếp cận cho chính người dùng đó**: menu *Hỗ trợ tiếp cận* (cỡ chữ A / A+ / A++, tương phản cao, giảm chuyển động — áp dụng toàn app), **nhập bằng giọng nói** tiếng Việt cho AI Stylist (hữu ích khi khó gõ phím), nút bấm ≥ 44 px, nhãn cho trình đọc màn hình.

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
| `npm start` | Chạy production, phục vụ `dist/` (chạy `npm run build` trước) |
| `npm run lint` | Kiểm tra kiểu TypeScript |
| `npm run check` | lint + build |

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
  ├─ /api/gemini/design     Gemini ▸ thiết kế trọn bộ phối từ câu mô tả + giải thích (enum allow-list, server kiểm tra lại)
  ├─ /api/gemini/adaptive   Gemini ▸ lời khuyên may đo thích ứng dựa trên thông số + kết quả văn hóa do server tính lại
  ├─ /api/gemini/vision     Gemini ▸ đọc ảnh → bảng màu → khớp màu Việt phục đã duyệt (ΔE Lab)
  └─ /api/gemini/render     Gemini (Nano Banana) ▸ ảnh minh họa từ prompt dựng bằng dữ liệu đã xác thực
  ▼
Dữ liệu tri thức (data/*.json, validate bằng zod + kiểm tra toàn vẹn quan hệ)
  y phục · phụ kiện · dịp · thời tiết · luật văn hóa · nguồn thẩm định · điều chỉnh thích ứng
```

- **Gemini API** qua `@google/genai` (`models.generateContent`, output JSON theo `responseJsonSchema`). Model mặc định: `gemini-3.8-flash` (văn bản, đọc ảnh; dự phòng `gemini-3.5-flash`), `gemini-3.1-flash-image` (tạo ảnh; dự phòng `gemini-3.1-flash-image-preview`); tự thử model dự phòng nếu model chính không khả dụng. Đổi bằng biến môi trường (xem `.env.example`).
- **Không có khóa, Gemini lỗi hoặc máy chủ chạy bản cũ (404)** → trình duyệt tự dùng bộ thiết kế tất định, mọi tính năng vẫn chạy: nhận diện câu theo từ khóa, xếp hạng tất định, lời bình lấy từ dữ liệu. Giao diện ghi rõ đang ở chế độ dự phòng.
- `store: false` cho mọi lời gọi Gemini; ảnh người dùng không lưu trên server.
- Giới hạn tần suất theo IP (văn bản 40/phút, đọc ảnh 8/phút, tạo ảnh 12/giờ + trần toàn cục `VSTYLE_RENDER_HOURLY_CAP`) để bảo vệ hạn mức khi chia sẻ app.

### Hình minh họa editorial (SVG)

`src/lib/visualization/editorial/` vẽ người mẫu và trang phục bằng SVG nhiều lớp thay cho vector phẳng:
- **Vải 3 tông**: nền + bóng nếp gấp (blur) + highlight sợi lụa; gấm hoa văn cho áo tấc/lễ phục.
- **Đúng kết cấu**: số cúc, kiểu vạt, cổ, tay, độ dài tà đọc từ `structure` trong `data/garments.json`; áo ngũ thân/áo dài cài **hữu nhậm** (vạt trái đè sang phải).
- **Phụ kiện trên điểm neo** (đầu, tóc, cổ, eo, tay, chân) có lớp bóng riêng; **phông nền theo dịp** + ánh sáng theo thời tiết.
- **Hòa nhập**: tư thế ngồi xe lăn thanh lịch, tà/xẻ/tay thay đổi theo thông số may đo; cùng một `geometry.ts` dùng cho hình vẽ, chú thích và tay kéo trong Studio nên luôn khớp.

### Phòng 3D & Tham quan ảo

- Dựng bằng **three.js** (tải lười — chỉ tải khi mở phòng 3D), không cần file 3D bên ngoài: mannequin, y phục và khung cảnh đều sinh tự động từ `data/garments.json` (template kết cấu, màu, phụ kiện, vạt hữu nhậm).
- **VR**: nút "Vào VR" (WebXR `immersive-vr`) trên kính Meta Quest / Pico; trigger để đọc điểm thông tin, grip để sang điểm tham quan tiếp theo.
- **AR**: "Xem AR" (WebXR `immersive-ar`) trên Android Chrome có ARCore; iPhone/iPad dùng nút **.USDZ** để mở AR Quick Look.
- **3D Object**: "Tải .GLB" xuất mô hình glTF nhị phân (Blender, Windows 3D Viewer, Unity/Unreal, Sketchfab).
- VR/AR yêu cầu trang chạy qua **HTTPS** (bản deploy trên AI Studio / Cloud Run đáp ứng).

## 4. Gemini được dùng thế nào & giữ đúng văn hóa ra sao

1. **Gemini hiểu, dữ liệu quyết định.** Gemini chỉ được chọn giá trị trong allow-list do server tạo từ dữ liệu đã duyệt (JSON schema dạng `enum`, có `NONE` khi không chắc); server kiểm tra lại mọi ID.
2. **Luật văn hóa là tất định.** Rule engine chấm điểm Chuẩn từ luật có nguồn; Gemini nhận kết quả như "sự thật bất biến" và bị cấm thêm sử liệu/luật mới.
3. **Không suy diễn về cơ thể.** Nhu cầu thích ứng chỉ lấy khi người dùng tự nói; khi đọc ảnh, Gemini chỉ mô tả trang phục và màu, không bình luận vóc dáng, khuôn mặt, tuổi, giới tính, sắc tộc.
4. **Ảnh AI có checklist.** Prompt tạo ảnh chèn nguyên văn đặc trưng kết cấu + quy tắc không được làm sai (vạt hữu nhậm…); giao diện hiện checklist để người dùng đối chiếu, ghi rõ "ảnh minh họa AI, có SynthID".
5. **Luôn có đường lui.** Mọi lỗi (hết hạn mức, sai JSON, timeout) đều rơi về kết quả tất định; output quá dài được cắt thay vì bỏ.

## 5. Deploy lên Google AI Studio (ai.studio)

1. Vào [aistudio.google.com](https://aistudio.google.com) → **Build**.
2. Trong ô prompt bấm **+ → Import from GitHub**, chọn repo này và nhánh muốn deploy (mã nguồn nằm ở thư mục gốc repo để AI Studio nhận đúng `package.json`).
3. **Settings → Secrets**: đảm bảo có `GEMINI_API_KEY` (AI Studio thường tự cấu hình cho app dùng Gemini). Tùy chọn thêm `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`…
4. Chạy thử trong khung Preview: ô "Chế độ dự phòng" phải chuyển thành **"Gemini đang bật"**.
5. Bấm **Deploy / Publish** (Cloud Run). Có thể đặt URL dạng `https://ten-app.ai.studio` để nộp cho Ban giám khảo.
6. Kiểm tra nhanh sau deploy: mở `/api/health` → `hasGeminiKey: true`, `features.imageRender: true`.

> Lưu ý: khi chia sẻ app, lượt gọi Gemini tính vào hạn mức của chủ app. Tạo ảnh có thể cần tài khoản có quyền dùng model ảnh; nếu không, app vẫn hiển thị mockup vector và thông báo rõ ràng.

### Deploy lên Vercel

Vercel chỉ phục vụ giao diện tĩnh (`dist`), không chạy `server.ts`, nên API được đóng gói sẵn thành hàm serverless `api/index.js` (từ `src/server/vercel.ts`). `vercel.json` chuyển mọi `/api/*` vào hàm này.

1. Vercel → **Add New → Project** → import repo, nhánh `main` (Framework: Vite — tự nhận từ `vercel.json`).
2. **Settings → Environment Variables**: thêm `GEMINI_API_KEY` (Production + Preview). Tùy chọn: `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`.
3. **Deployments → Redeploy** (biến môi trường chỉ có hiệu lực sau khi deploy lại).
4. Kiểm tra `https://<app>.vercel.app/api/health` → `"design": true`, `"hasGeminiKey": true`.

Khi sửa code phía server (`src/lib/gemini`, `src/lib/design`, `data/`…), chạy `npm run build:api` rồi commit lại `api/index.js` (`npm run check` đã tự chạy bước này).

## 6. Cấu trúc thư mục

```
server.ts                  Express + Vite middleware (chạy local / AI Studio)
src/server/app.ts          API Express dùng chung (health + Gemini)
api/index.js               Hàm serverless cho Vercel (build từ src/server/vercel.ts)
src/App.tsx                Khung app + định tuyến (#/studio, #/adaptive, #/3d, #/kien-thuc, #/lookbook)
src/components/studio/     AI tạo (AiDesigner) + Tự tạo (StudioEditor)
src/components/knowledge/  Các loại Việt phục + Quiz
src/components/lookbook/   Lookbook: đã lưu, bản nháp, bảng tin
src/lib/design/            Bộ thiết kế bản phối từ câu mô tả (fallback + kiểm tra kết quả Gemini)
src/components/            UI (HomeHero, StylingWorkspace, Studio, VirtualShowroom, AiRenderPanel, ColorHarmonyCard, CompareView…)
src/lib/three/             Mô hình 3D y phục (figure.ts) + khung cảnh tham quan ảo (tours.ts)
src/lib/gemini/            provider (model + dự phòng), service (prompt + JSON schema + allow-list), routes (giới hạn tần suất), client
src/lib/culture/           Rule engine văn hóa tất định
src/lib/adaptive/          Preset nhu cầu thích ứng, bộ phối phụ kiện theo nhu cầu (stylingKits.ts), rule engine Thích ứng × Bản sắc (cultureGuard.ts)
src/lib/visualization/editorial/  Hình minh họa SVG editorial (geometry, vải, phụ kiện, phông nền, xe lăn, chú thích)
src/lib/recommendation/    Bộ gợi ý tất định + bản đồ từ khóa dự phòng
src/lib/color/             Toán màu (Lab ΔE, WCAG contrast) + kiểm tra hài hòa
data/                      Cơ sở tri thức (JSON) — chỉ bản ghi APPROVED + có nguồn mới được dùng
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
