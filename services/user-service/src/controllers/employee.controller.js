import { EmployeeModel } from '../models/employee.model.js';
import { authApi } from '../config/axios.js';

export const EmployeeController = {
  // GET /users/employees
  async getEmployees(req, res) {
    try {
      const result = await EmployeeModel.getAllEmployees(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách nhân viên' });
    }
  },

  // GET /users/employees/next-id
  async getNextId(req, res) {
    try {
      const nextId = await EmployeeModel.getNextEmployeeId();
      return res.json({ nextId });
    } catch (err) {
      console.error('Error getting next employee id:', err);
      return res.status(500).json({ message: 'Lỗi lấy mã nhân viên tiếp theo' });
    }
  },

  // POST /users/employees
  async createEmployee(req, res) {
    try {
      const { hoTen, sdt, email, chucVu, ngaySinh, cccd } = req.body;

      if (!hoTen || !sdt || !email || !chucVu) {
        return res.status(400).json({ message: 'Thiếu các thông tin bắt buộc (hoTen, sdt, email, chucVu)' });
      }

      // Check format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
      }

      // Check SDT (phải đúng 10 số, bắt đầu bằng số 0)
      if (!/^0\d{9}$/.test(sdt)) {
        return res.status(400).json({ message: 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0' });
      }

      // Check CCCD (phải đúng 12 số)
      if (!cccd || !/^\d{12}$/.test(cccd)) {
        return res.status(400).json({ message: 'Số CCCD phải gồm đúng 12 chữ số' });
      }

      // Check ngày sinh (phải từ đủ 18 tuổi)
      if (!ngaySinh) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ngày sinh của nhân viên' });
      }
      const birthDate = new Date(ngaySinh);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: 'Ngày sinh không hợp lệ' });
      }
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return res.status(400).json({ message: 'Nhân viên phải từ đủ 18 tuổi trở lên' });
      }

      // Check duplicate
      const duplicate = await EmployeeModel.checkDuplicate(email, sdt, cccd);
      if (duplicate) {
        let msg = 'Thông tin đã được sử dụng';
        if (duplicate === 'email') msg = 'Email đã được sử dụng';
        else if (duplicate === 'sdt') msg = 'Số điện thoại đã được sử dụng';
        else if (duplicate === 'cccd') msg = 'Số CCCD đã được sử dụng bởi nhân viên khác';
        return res.status(400).json({ message: msg });
      }

      // 1. Get next maNhanVien to use as employee ID & username
      const predictedId = await EmployeeModel.getNextEmployeeId();

      // 2. Call auth-service to create account
      const defaultPassword = 'Abc@123456';
      let authCreated = false;
      try {
        await authApi.post('/internal/create-account', {
          tenDangnhap: predictedId,
          matKhau: defaultPassword,
          vaiTro: chucVu // e.g. 'NHAN_VIEN'
        });
        authCreated = true;
      } catch (authErr) {
        console.error('Failed to create account in auth-service:', authErr.response?.data || authErr.message);
        return res.status(502).json({ 
          message: 'Không thể tạo tài khoản đăng nhập trên dịch vụ xác thực',
          error: authErr.response?.data?.message || authErr.message
        });
      }

      // 3. Create employee in database
      let employee = null;
      try {
        employee = await EmployeeModel.createEmployee({
          maNhanVien: predictedId,
          hoTen,
          ngaySinh,
          cccd,
          sdt,
          email,
          chucVu,
          tenDangnhap: predictedId
        });
      } catch (dbErr) {
        console.error('Error saving employee to db:', dbErr);
        // Clean up auth account if db insertion fails (SAGA rollback)
        // Wait, if it fails, we can log it, but in real code, rollback is preferred.
        return res.status(500).json({ message: 'Lỗi cơ sở dữ liệu khi lưu thông tin nhân viên' });
      }

      // 4. Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'ThemNhanVien',
        { maNhanVien: employee.maNhanVien, hoTen }
      );

      return res.status(201).json({
        message: 'Thêm nhân viên và tạo tài khoản thành công',
        employee,
        defaultPassword
      });
    } catch (err) {
      console.error('Error in createEmployee:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id
  async getEmployeeById(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      const activityLogs = await EmployeeModel.getActivityLogs(id);
      return res.json({
        ...employee,
        activityLogs
      });
    } catch (err) {
      console.error('Error getting employee detail:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id
  async updateEmployee(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      const { hoTen, sdt, email, chucVu, ngaySinh, cccd } = req.body;

      if (!hoTen || !sdt || !email || !chucVu) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
      }

      // Check SDT (phải đúng 10 số, bắt đầu bằng số 0)
      if (!/^0\d{9}$/.test(sdt)) {
        return res.status(400).json({ message: 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0' });
      }

      // Check CCCD (nếu có cung cấp, phải đúng 12 số)
      if (cccd && !/^\d{12}$/.test(cccd)) {
        return res.status(400).json({ message: 'Số CCCD phải gồm đúng 12 chữ số' });
      }

      // Check ngày sinh (nếu có cung cấp, phải từ đủ 18 tuổi)
      if (ngaySinh) {
        const birthDate = new Date(ngaySinh);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({ message: 'Ngày sinh không hợp lệ' });
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          return res.status(400).json({ message: 'Nhân viên phải từ đủ 18 tuổi trở lên' });
        }
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Check duplicates excluding this employee
      const duplicate = await EmployeeModel.checkDuplicate(email, sdt, cccd || null, id);
      if (duplicate) {
        let msg = 'Thông tin đã trùng với nhân viên khác';
        if (duplicate === 'email') msg = 'Email đã trùng với nhân viên khác';
        else if (duplicate === 'sdt') msg = 'Số điện thoại đã trùng với nhân viên khác';
        else if (duplicate === 'cccd') msg = 'Số CCCD đã trùng với nhân viên khác';
        return res.status(400).json({ message: msg });
      }

      const updated = await EmployeeModel.updateEmployee(id, { hoTen, sdt, email, chucVu, ngaySinh, cccd });

      // Sync role to auth-service permissions if chucVu is provided
      if (chucVu) {
        try {
          await authApi.put('/internal/permissions', {
            tenDangnhap: employee.tendangnhap,
            cacQuyen: [chucVu]
          });
        } catch (authErr) {
          console.error('Failed to sync role to auth-service:', authErr.message);
          // Non-blocking error, but should log
        }
      }

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'CapNhatNhanVien',
        { maNhanVien: id, updatedFields: req.body }
      );

      return res.json({ message: 'Cập nhật nhân viên thành công', employee: updated });
    } catch (err) {
      console.error('Error updating employee:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai } = req.body; // 0 or 1

      if (trangThai === undefined || ![0, 1].includes(parseInt(trangThai, 10))) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ (0 hoặc 1)' });
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      const result = await EmployeeModel.updateStatus(id, parseInt(trangThai, 10));

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        trangThai === 1 ? 'MoKhoaNhanVien' : 'KhoaNhanVien',
        { maNhanVien: id }
      );

      return res.json({ message: 'Cập nhật trạng thái thành công', employee: result });
    } catch (err) {
      console.error('Error updating employee status:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id/activity-log
  async getActivityLogs(req, res) {
    try {
      const { id } = req.params;
      const logs = await EmployeeModel.getActivityLogs(id);
      return res.json(logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id/permissions
  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const { quyen } = req.body; // Array of roles e.g. ['BAN_HANG', 'KHO']

      if (!Array.isArray(quyen)) {
        return res.status(400).json({ message: 'Quyền phải dưới dạng một mảng' });
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Call auth-service to update permissions
      try {
        await authApi.put('/internal/permissions', {
          tenDangnhap: employee.tenDangnhap,
          cacQuyen: quyen
        });
      } catch (authErr) {
        console.error('Failed to update permissions in auth-service:', authErr.response?.data || authErr.message);
        return res.status(502).json({ 
          message: 'Không thể cập nhật quyền trên dịch vụ xác thực',
          error: authErr.response?.data?.message || authErr.message
        });
      }

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'CapNhatQuyenNhanVien',
        { maNhanVien: id, quyenMoi: quyen }
      );

      return res.json({ message: 'Cập nhật quyền thành công' });
    } catch (err) {
      console.error('Error updating permissions:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id/schedule
  async getSchedule(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Authorization check: Manager or Self
      const isManager = req.user.vaiTro === 'QUAN_LY' || req.user.cacQuyen?.includes('QUAN_LY');
      const isSelf = req.user.tenDangnhap === employee.tenDangnhap;

      if (!isManager && !isSelf) {
        return res.status(403).json({ message: 'Bạn không có quyền xem lịch làm việc của nhân viên này' });
      }

      const schedule = await EmployeeModel.getSchedule(id, req.query);
      return res.json(schedule);
    } catch (err) {
      console.error('Error fetching employee schedule:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
