# 👑 Vua Đặc Sản - E-Commerce Microservices

Nền tảng thương mại điện tử đặc sản vùng miền 3 miền Bắc - Trung - Nam, xây dựng theo kiến trúc **Microservices** hướng sự kiện.

---

## 🛠️ Công Nghệ Chính

* **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Zustand.
* **Backend:** Node.js (Express), API Gateway (Nginx), RabbitMQ, Redis.
* **Database & Storage:** PostgreSQL 16 (7 DB độc lập), Supabase Cloud Storage.

---

## 📂 Cấu Trúc Thư Mục

```text
vua-dac-san/
├── frontend/             # Giao diện người dùng (React + Vite + Tailwind)
├── services/             # 8 Microservices backend & API Gateway
│   ├── api-gateway/      # Nginx Reverse Proxy
│   ├── auth-service/     # Xác thực & phân quyền
│   ├── user-service/     # Nhân viên & nhà cung cấp
│   ├── product-service/  # Sản phẩm & kho hàng
│   ├── order-service/    # Đơn hàng & thanh toán
│   ├── warehouse-service/# Phiếu nhập / xuất kho
│   ├── finance-service/  # Doanh thu & tài chính
│   ├── content-service/  # Bài viết & CSKH ticket
│   └── notification-service/ # Email OTP & thông báo
├── docker-compose.yml    # Khởi chạy toàn bộ hệ thống
└── .env.example          # Cấu hình mẫu môi trường
```

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu tiên quyết
* Đã cài đặt **Docker** và **Docker Compose** ([Tải Docker Desktop](https://www.docker.com/products/docker-desktop/)).
* Đã cài đặt **Git** và **Node.js** (khuyến nghị >= v18 nếu muốn chạy lệnh npm cục bộ).

### 2. Các bước cài đặt chi tiết

**Bước 1: Clone repository về máy**
```bash
git clone https://github.com/minhtanhehe/vua-dac-san.git
cd vua-dac-san
```

**Bước 2: Cấu hình biến môi trường**
Sao chép file `.env.example` thành file `.env` ở thư mục gốc:
```bash
# Trên Windows PowerShell / Command Prompt:
copy .env.example .env

# Trên macOS / Linux:
cp .env.example .env
```
*(Các giá trị mặc định trong `.env.example` đã được cấu hình sẵn để hệ thống chạy ngay lập tức)*.

**Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose**
```bash
docker compose up -d
```
> Lệnh này sẽ tự động tải các image cần thiết, build các service và khởi động toàn bộ 19 container trong nền.

**Bước 4: Kiểm tra trạng thái hoạt động**
```bash
docker compose ps
```
Đảm bảo tất cả các container đều ở trạng thái `Up` (hoặc `healthy`).

**Bước 5: Truy cập ứng dụng**
* **Trang web Khách hàng**: [http://localhost](http://localhost) (hoặc [http://localhost:3000](http://localhost:3000))
* **Trang Đăng nhập Quản trị**: [http://localhost/login](http://localhost/login)
* **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) *(Tài khoản: `guest` / Mật khẩu: `guest`)*
* **API Gateway Health Check**: [http://localhost/api/auth/health](http://localhost/api/auth/health)

### 3. Một số lệnh hữu ích khi vận hành
```bash
# Xem log của một service cụ thể (ví dụ: order-service)
docker compose logs -f order-service

# Khởi động lại một service sau khi sửa code
docker compose restart product-service

# Dừng toàn bộ hệ thống
docker compose down

# Dừng và xóa toàn bộ dữ liệu database (reset sạch hệ thống)
docker compose down -v
```


## 🌐 Chạy Online (Vercel + Ngrok)

1. Mở hầm Ngrok tới cổng 80 của Gateway:
   ```bash
   ngrok http 80
   ```
2. Cấu hình biến môi trường trên **Vercel** ➔ **Settings** ➔ **Environment Variables**:
   * **`VITE_API_URL`**: `https://<ngrok-domain>.ngrok-free.dev/api`
3. Redeploy lại Frontend trên Vercel.
