-- SQL Schema for product-service
-- Database: product_db

-- Table: DANH_MUC_SP
CREATE TABLE IF NOT EXISTS DANH_MUC_SP (
    maDanhMuc VARCHAR(20) PRIMARY KEY,
    tenDanhMuc VARCHAR(100) NOT NULL,
    moTa TEXT NULL,
    vungMien VARCHAR(20) CHECK (vungMien IN ('Miền Bắc', 'Miền Trung', 'Miền Nam')),
    trangThai BOOLEAN DEFAULT TRUE
);

-- Table: SAN_PHAM
CREATE TABLE IF NOT EXISTS SAN_PHAM (
    maSanpham VARCHAR(20) PRIMARY KEY,
    tenSanpham VARCHAR(150) NOT NULL,
    maDanhMuc VARCHAR(20) REFERENCES DANH_MUC_SP(maDanhMuc),
    hinhAnh VARCHAR(255) NULL,
    motaSanpham TEXT NULL,
    donViTinh VARCHAR(20) NULL,
    giaDon DECIMAL(18,2) NOT NULL CHECK (giaDon >= 0),
    soLuongTon INT DEFAULT 0 CHECK (soLuongTon >= 0),
    hanSuDung DATE NULL,
    trangThai VARCHAR(30) DEFAULT 'Còn hàng',
    maNCC VARCHAR(20) NULL, -- reference only to user-service (NHA_CUNG_CAP)
    ngayTao TIMESTAMP DEFAULT NOW(),
    ngayCapNhat TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sanpham_hansudung ON SAN_PHAM(hanSuDung);
CREATE INDEX IF NOT EXISTS idx_sanpham_madanhmuc ON SAN_PHAM(maDanhMuc);
CREATE INDEX IF NOT EXISTS idx_sanpham_trangthai ON SAN_PHAM(trangThai);

-- Trigger for updating ngayCapNhat
CREATE OR REPLACE FUNCTION update_ngaycapnhat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngayCapNhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_sanpham_ngaycapnhat
BEFORE UPDATE ON SAN_PHAM
FOR EACH ROW
EXECUTE FUNCTION update_ngaycapnhat_column();

-- View for products expiring within 30 days
CREATE OR REPLACE VIEW view_sanpham_sap_het_han AS
SELECT 
    maSanpham,
    tenSanpham,
    maDanhMuc,
    soLuongTon,
    hanSuDung,
    (hanSuDung - CURRENT_DATE) AS soNgayConLai
FROM 
    SAN_PHAM
WHERE 
    hanSuDung IS NOT NULL 
    AND hanSuDung <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY 
    hanSuDung ASC;

-- Initial categories for 3 regions (9 categories per region)
INSERT INTO DANH_MUC_SP (maDanhMuc, tenDanhMuc, moTa, vungMien, trangThai) VALUES
-- Miền Bắc
('DM001', 'Đặc sản thịt', '', 'Miền Bắc', true),
('DM010', 'Bánh kẹo truyền thống', '', 'Miền Bắc', true),
('DM011', 'Ăn vặt', '', 'Miền Bắc', true),
('DM012', 'Gia vị', '', 'Miền Bắc', true),
('DM005', 'Rượu & Trà', '', 'Miền Bắc', true),
('DM013', 'Thủy Hải Sản Khô', '', 'Miền Bắc', true),
('DM014', 'Trái cây đặc sản', '', 'Miền Bắc', true),
('DM008', 'Bún & Phở khô', '', 'Miền Bắc', true),
('DM015', 'Bánh truyền thống', '', 'Miền Bắc', true),
-- Miền Trung
('DM016', 'Đặc sản thịt', '', 'Miền Trung', true),
('DM017', 'Bánh kẹo truyền thống', '', 'Miền Trung', true),
('DM003', 'Ăn vặt', '', 'Miền Trung', true),
('DM018', 'Gia vị', '', 'Miền Trung', true),
('DM019', 'Rượu & Trà', '', 'Miền Trung', true),
('DM006', 'Thủy Hải Sản Khô', '', 'Miền Trung', true),
('DM020', 'Trái cây đặc sản', '', 'Miền Trung', true),
('DM021', 'Bún & Phở khô', '', 'Miền Trung', true),
('DM009', 'Bánh truyền thống', '', 'Miền Trung', true),
-- Miền Nam
('DM022', 'Đặc sản thịt', '', 'Miền Nam', true),
('DM002', 'Bánh kẹo truyền thống', '', 'Miền Nam', true),
('DM023', 'Ăn vặt', '', 'Miền Nam', true),
('DM004', 'Gia vị', '', 'Miền Nam', true),
('DM024', 'Rượu & Trà', '', 'Miền Nam', true),
('DM025', 'Thủy Hải Sản Khô', '', 'Miền Nam', true),
('DM007', 'Trái cây đặc sản', '', 'Miền Nam', true),
('DM026', 'Bún & Phở khô', '', 'Miền Nam', true),
('DM027', 'Bánh truyền thống', '', 'Miền Nam', true)
ON CONFLICT (maDanhMuc) DO UPDATE SET tenDanhMuc = EXCLUDED.tenDanhMuc, vungMien = EXCLUDED.vungMien, trangThai = true;

