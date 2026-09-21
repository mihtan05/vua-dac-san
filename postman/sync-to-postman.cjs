const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.POSTMAN_API_KEY || '';
const WORKSPACE_ID = process.env.POSTMAN_WORKSPACE_ID || '7ffc41bf-a4b0-40af-8c16-05176c812d70';

const collectionData = {
  info: {
    name: 'Vua Đặc Sản - Integration Tests',
    description: 'Bộ kiểm thử tích hợp (Integration Tests) cho hệ thống Microservices Vua Đặc Sản:\n1. Kiểm thử phân quyền RBAC giữa Nhân viên (NHAN_VIEN) và Quản lý (QUAN_LY)\n2. Kiểm thử tích hợp User-Service <-> Auth-Service (Tạo NV mới & Tự sinh tài khoản đăng nhập)\n3. Kiểm thử luồng Sản phẩm & Kho qua API Gateway',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: [
    {
      name: '1. Phân quyền RBAC (Nhân viên vs Quản lý)',
      item: [
        {
          name: '1.1 Đăng nhập Quản lý (Admin)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.1 Đăng nhập Admin thành công (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '    var data = pm.response.json();',
                  '    pm.expect(data).to.have.property("accessToken");',
                  '    pm.expect(data.user.vaiTro).to.eql("QUAN_LY");',
                  '    pm.environment.set("adminToken", data.accessToken);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email_hoac_sdt: 'admin', matKhau: 'Admin@123456' }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/auth/login',
              host: ['{{baseUrl}}'],
              path: ['auth', 'login']
            }
          }
        },
        {
          name: '1.2 Đăng nhập Nhân viên (Staff)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.2 Đăng nhập Nhân viên thành công (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '    var data = pm.response.json();',
                  '    pm.expect(data).to.have.property("accessToken");',
                  '    pm.expect(data.user.vaiTro).to.eql("NHAN_VIEN");',
                  '    pm.environment.set("staffToken", data.accessToken);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email_hoac_sdt: 'nhanvien', matKhau: 'Nhanvien@123' }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/auth/login',
              host: ['{{baseUrl}}'],
              path: ['auth', 'login']
            }
          }
        },
        {
          name: '1.3 [Nhân viên] Xem danh sách đơn hàng (Được phép: 200)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.3 Nhân viên được phép xem đơn hàng (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
            url: {
              raw: '{{baseUrl}}/orders/',
              host: ['{{baseUrl}}'],
              path: ['orders', '']
            }
          }
        },
        {
          name: '1.4 [Nhân viên] Truy cập Mã giảm giá (Bị chặn: 403 Forbidden)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.4 Nhân viên KHÔNG được phép xem Mã giảm giá (403 Forbidden)", function () {',
                  '    pm.response.to.have.status(403);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
            url: {
              raw: '{{baseUrl}}/orders/promos',
              host: ['{{baseUrl}}'],
              path: ['orders', 'promos']
            }
          }
        },
        {
          name: '1.5 [Quản lý] Truy cập Mã giảm giá (Được phép: 200 OK)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.5 Quản lý được phép xem Mã giảm giá (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/orders/promos',
              host: ['{{baseUrl}}'],
              path: ['orders', 'promos']
            }
          }
        },
        {
          name: '1.6 [Nhân viên] Truy cập Quản lý nhân viên (Bị chặn: 403 Forbidden)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.6 Nhân viên KHÔNG được phép vào Quản lý nhân viên (403 Forbidden)", function () {',
                  '    pm.response.to.have.status(403);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
            url: {
              raw: '{{baseUrl}}/users/employees',
              host: ['{{baseUrl}}'],
              path: ['users', 'employees']
            }
          }
        },
        {
          name: '1.7 [Quản lý] Truy cập Quản lý nhân viên (Được phép: 200 OK)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.7 Quản lý được phép vào Quản lý nhân viên (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/users/employees',
              host: ['{{baseUrl}}'],
              path: ['users', 'employees']
            }
          }
        },
        {
          name: '1.8 [Nhân viên] Truy cập Nhà cung cấp (Bị chặn: 403 Forbidden)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.8 Nhân viên KHÔNG được phép vào Nhà cung cấp (403 Forbidden)", function () {',
                  '    pm.response.to.have.status(403);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
            url: {
              raw: '{{baseUrl}}/users/suppliers',
              host: ['{{baseUrl}}'],
              path: ['users', 'suppliers']
            }
          }
        },
        {
          name: '1.9 [Quản lý] Truy cập Nhà cung cấp (Được phép: 200 OK)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("1.9 Quản lý được phép vào Nhà cung cấp (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/users/suppliers',
              host: ['{{baseUrl}}'],
              path: ['users', 'suppliers']
            }
          }
        }
      ]
    },
    {
      name: '2. Tích hợp User-Service <-> Auth-Service (Tạo NV mới & Login)',
      item: [
        {
          name: '2.1 [Quản lý] Tạo nhân viên mới',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  'var rand = Math.floor(1000 + Math.random() * 9000);',
                  'pm.environment.set("tempEmail", "test.nv" + rand + "@vuadacsan.com");',
                  'pm.environment.set("tempPhone", "098" + rand + "888");',
                  'pm.environment.set("tempCccd", "079095" + rand + "99");'
                ],
                type: 'text/javascript'
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("2.1 User-service tạo nhân viên thành công (200 hoặc 201)", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
                  '    var res = pm.response.json();',
                  '    var emp = res.employee || res.data || res;',
                  '    var username = emp.tenDangnhap || emp.tendangnhap || emp.maNhanVien || emp.manhanvien;',
                  '    pm.expect(username).to.be.a("string");',
                  '    pm.environment.set("newCreatedStaffUsername", username);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                hoTen: 'Nhân viên Test Integration',
                sdt: '{{tempPhone}}',
                email: '{{tempEmail}}',
                chucVu: 'NHAN_VIEN',
                ngaySinh: '1996-08-15',
                cccd: '{{tempCccd}}'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/users/employees',
              host: ['{{baseUrl}}'],
              path: ['users', 'employees']
            }
          }
        },
        {
          name: '2.2 Đăng nhập bằng tài khoản nhân viên vừa tạo (Auth-Service xác thực)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("2.2 Đăng nhập thành công bằng tài khoản do User-service tự sinh (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '    var data = pm.response.json();',
                  '    pm.expect(data).to.have.property("accessToken");',
                  '    pm.expect(data.user.vaiTro).to.eql("NHAN_VIEN");',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email_hoac_sdt: '{{newCreatedStaffUsername}}',
                matKhau: 'Abc@123456'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/auth/login',
              host: ['{{baseUrl}}'],
              path: ['auth', 'login']
            }
          }
        }
      ]
    },
    {
      name: '3. Tích hợp Sản phẩm & Đơn hàng qua Gateway',
      item: [
        {
          name: '3.1 Duyệt danh sách sản phẩm (Public)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("3.1 Lấy danh sách sản phẩm thành công (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            url: {
              raw: '{{baseUrl}}/products/',
              host: ['{{baseUrl}}'],
              path: ['products', '']
            }
          }
        },
        {
          name: '3.2 [Nhân viên] Tạo sản phẩm mới (POST /api/products/)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("3.2 Tạo sản phẩm mới thành công (201 Created)", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{staffToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                tenSanpham: 'Kẹo Dừa Bến Tre Sầu Riêng Lá Dứa',
                maDanhMuc: 'DM001',
                giaDon: 45000,
                donViTinh: 'Hộp',
                motaSanpham: 'Kẹo dừa béo ngậy thơm lừng đặc sản xứ dừa Bến Tre.',
                hanSuDung: '2027-01-01'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/products/',
              host: ['{{baseUrl}}'],
              path: ['products', '']
            }
          }
        },
        {
          name: '3.3 [Nhân viên] Kiểm tra sản phẩm sắp hết hạn',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("3.3 Lấy danh sách cảnh báo hạn sử dụng thành công (200 OK)", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ],
                type: 'text/javascript'
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
            url: {
              raw: '{{baseUrl}}/products/expiry-warning',
              host: ['{{baseUrl}}'],
              path: ['products', 'expiry-warning']
            }
          }
        }
      ]
    }
  ]
};

const environmentData = {
  name: 'Vua Đặc Sản (Local Dev)',
  values: [
    { key: 'baseUrl', value: 'http://localhost/api', enabled: true },
    { key: 'adminToken', value: '', enabled: true },
    { key: 'staffToken', value: '', enabled: true },
    { key: 'newCreatedStaffUsername', value: '', enabled: true }
  ]
};

// Helper function to send HTTPS request
function postmanRequest(endpoint, method, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.getpostman.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Postman API Error [${res.statusCode}]: ` + JSON.stringify(parsed)));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response [${res.statusCode}]: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('1. Đang đẩy Collection lên Postman Cloud Workspace...');
  const colRes = await postmanRequest(
    `/collections?workspace=${WORKSPACE_ID}`,
    'POST',
    { collection: collectionData }
  );
  console.log('✅ Tạo Collection thành công!');
  console.log('   Tên Collection:', colRes.collection.name);
  console.log('   UID:', colRes.collection.uid);

  console.log('\n2. Đang đẩy Environment lên Postman Cloud Workspace...');
  const envRes = await postmanRequest(
    `/environments?workspace=${WORKSPACE_ID}`,
    'POST',
    { environment: environmentData }
  );
  console.log('✅ Tạo Environment thành công!');
  console.log('   Tên Environment:', envRes.environment.name);
  console.log('   UID:', envRes.environment.uid);

  // Save local copies
  const postmanDir = path.join(__dirname);
  fs.writeFileSync(
    path.join(postmanDir, 'vua-dac-san.postman_collection.json'),
    JSON.stringify(collectionData, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(postmanDir, 'vua-dac-san.postman_environment.json'),
    JSON.stringify(environmentData, null, 2),
    'utf-8'
  );
  console.log('\n✅ Đã lưu bản sao file JSON cục bộ vào thư mục postman/ thành công!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
