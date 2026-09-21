-- Seed data for auth-service
-- Initial admin account (username: admin, password: Admin@123456)
-- Bcrypt hash with salt rounds = 12: $2b$12$Yr03LSJwDwMunvMIZmgzyuOX.5GBBSdf3F19EeP.gBMSXIdQDJ0Ga

INSERT INTO TAI_KHOAN (tenDangnhap, matKhau, vaiTro, trangThai, buocDauDoiMatKhau)
VALUES ('admin', '$2b$12$Yr03LSJwDwMunvMIZmgzyuOX.5GBBSdf3F19EeP.gBMSXIdQDJ0Ga', 'QUAN_LY', 1, FALSE)
ON CONFLICT (tenDangnhap) DO NOTHING;

-- Default employee account (username: nhanvien, password: Nhanvien@123)
-- Bcrypt hash with salt rounds = 12 (will be generated at startup)
INSERT INTO TAI_KHOAN (tenDangnhap, matKhau, vaiTro, trangThai, buocDauDoiMatKhau)
VALUES ('nhanvien', '$2b$12$Yr03LSJwDwMunvMIZmgzyuOX.5GBBSdf3F19EeP.gBMSXIdQDJ0Ga', 'NHAN_VIEN', 1, TRUE)
ON CONFLICT (tenDangnhap) DO NOTHING;

-- Assign NHAN_VIEN permission
INSERT INTO PHAN_QUYEN (maNhanVien, vaiTro)
VALUES ('nhanvien', 'NHAN_VIEN')
ON CONFLICT (maNhanVien, vaiTro) DO NOTHING;
