# Implementation Plan

## 2026-06-13: Preview still looks static after Build

> Mục tiêu là xác định vì sao người dùng vẫn không thấy animation sau khi bấm Build, dù runtime đã có tick. Kế hoạch này tách riêng ba khả năng: mở nhầm server/build cũ, player không thật sự auto-play, hoặc animation hiện tại quá khó nhận biết bằng mắt.

### Context đã xác nhận

-   Repo hiện ở commit local `174a975 fix: autoplay flow preview animation`.
-   App dependency đã khóa `@dongtran/flowmotion@0.8.8`.
-   Dev server đúng đang chạy ở `http://127.0.0.1:5174/`.
-   Máy cũng đang có server khác:
    -   `localhost:5000` trả `AirTunes/403`, không phải Flowmotion app.
    -   `localhost:4173` là Python static server, có thể là artifact cũ.
-   Playwright trước đó thấy DOM/runtime có chạy, nhưng người dùng vẫn không thấy animation bằng mắt thường.

### Research cần làm trước khi sửa

1. Kiểm tra `app/src/App.tsx`, `app/src/ViewerPane.tsx`, `app/src/app.css`, package CSS edge/node/player để hiểu visual signal hiện tại.
2. Dùng Playwright trên đúng URL `5174` để đo:
    - Preview tab có tự mở sau Build không.
    - Player có vào auto mode không.
    - Edge/path class `active` hoặc `was_active` có đổi theo thời gian không.
    - Computed style của active edge khác passive edge ra sao.
    - Screenshot/video frame có khác biệt đủ rõ không.
3. Kiểm tra URL `4173` để biết nó có đang phục vụ bản app cũ khiến người dùng nhìn nhầm không.

### Hướng fix dự kiến

1. Nếu lỗi là server/build cũ:
    - Không sửa logic, chỉ dừng/khuyến nghị dùng đúng URL và có thể start preview đúng bằng Vite.
2. Nếu auto-play chưa thật sự chạy:
    - Sửa package hoặc app để gọi mode auto sau khi story hydration/render DOM hoàn tất.
    - Build, publish package mới nếu lỗi nằm trong package.
3. Nếu animation chạy nhưng quá khó thấy:
    - Tăng visual affordance trong package CSS:
        - Active edge có stroke sáng hơn, dày hơn, dash animation rõ hơn.
        - Was-active edge vẫn visible nhưng dịu hơn.
        - Active method indicator rõ hơn nếu node đang thực thi.
    - Ưu tiên sửa package, publish version mới, rồi nâng app dependency lên version đó.

### Verification bắt buộc

1. `npm run typecheck` và `npm run build` ở package nếu package đổi.
2. Publish package version mới qua CI nếu cần.
3. `npm install --save-exact @dongtran/flowmotion@<new-version>` trong `app` nếu có package mới.
4. `npm run typecheck` và `npm run build` trong `app`.
5. Dùng Playwright tự thao tác:
    - Build Order flow, Cache flow, Incident flow.
    - Chụp screenshot ở thời điểm animation đang chạy.
    - So sánh computed style hoặc bounding style giữa passive và active edge.
    - Kiểm tra console không có error mới.
6. Commit, push, theo dõi GitHub Actions đến khi pass.
