---
title: "R0 — Foundation & IAM: backend chạy được từ Docker đến /auth/me"
date: 2026-10-27
tags: [backend, auth, infra]
module: auth
status: done
progress: 30
phase: R0
---

Mục tiêu: xây R0 — Foundation & IAM. Làm từ tối 27/10 đến 3h sáng 28/10.

Infrastructure (Docker):

- PostgreSQL 16, Redis 7, Keycloak 24 chạy qua docker-compose
- Fix: bỏ MinIO (chưa cần ở R0, image đã chuyển sang quay.io và bị 401)
- Fix: Keycloak tạo ~90 tables vào DB chính, nên tách riêng database `keycloak`

NestJS project setup:

- Khởi tạo NestJS với ESM mode
- Prisma schema gồm User + Profile, migration thành công
- Config module với Zod validation cho env vars
- Fix: `.default()` phải đặt trước `.transform()`
- Fix: thiếu packages do bỏ qua bước cài dependencies
- Fix: port 3000 → 8000 (3000 dành cho frontend)

Keycloak:

- Tạo realm `paper-progress`
- Client `pp-backend` (confidential) và `pp-frontend` (public SPA)
- Tạo test user, lấy token thành công qua curl

IAM module (Clean Architecture):

- Domain: User entity, repository port (interface + Symbol token)
- Infrastructure: Prisma repository implementation (upsert)
- Application: `SyncUserCommand` use case
- Presentation: `AuthController` với `GET /api/v1/auth/me`
- JWT Auth Guard verify token qua Keycloak JWKS
- Fix: bỏ audience check (audience mặc định của Keycloak là `account`, không phải `pp-backend`)
- Fix: thêm error logging trong catch block của guard để debug

Kết quả cuối cùng:

- `GET /health` ✅
- Lấy token từ Keycloak ✅
- `GET /api/v1/auth/me` trả về user data từ DB ✅
- CORS enabled ✅
