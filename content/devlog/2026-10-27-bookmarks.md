---
title: "Bookmark Manager"
date: 2026-10-27
tags: [content, frontend, design-system]
module: content
status: in_progress
progress: 30
phase: 1/3
---

Trang `/bookmarks` quản lý bài học đã lưu: cây thư mục kéo-thả, bộ lọc, tìm kiếm, hai kiểu hiển thị (lưới / bảng), sắp xếp, chọn nhiều và phân trang.

Ba thành phần dùng chung được thêm vào design system:

- `LayoutToggle`: nút chuyển lưới / danh sách
- `ProgressBar`: thanh tiến độ có `role="progressbar"`
- `FilterPanel`: nhóm bộ lọc thu gọn được, dùng lại cho trang tìm kiếm

Việc còn lại: lưu bookmark thật, thay dữ liệu mẫu bằng API.
