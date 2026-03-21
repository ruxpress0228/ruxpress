package com.ruxpress.domain.admin.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.config.JwtTokenProvider;
import com.ruxpress.domain.admin.dto.request.AdminLoginRequest;
import com.ruxpress.domain.admin.dto.response.AdminLoginResponse;
import com.ruxpress.domain.admin.dto.response.AdminResponse;
import com.ruxpress.domain.admin.entity.Admin;
import com.ruxpress.domain.admin.entity.AdminRole;
import com.ruxpress.domain.admin.entity.AdminStatus;
import com.ruxpress.domain.admin.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        if (admin.getStatus() != AdminStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        admin.updateLastLogin();
        adminRepository.save(admin);

        String token = jwtTokenProvider.createToken(admin.getId(), admin.getEmail(), admin.getRole().name());

        return new AdminLoginResponse(
                token,
                admin.getId(),
                admin.getEmail(),
                admin.getName(),
                admin.getRole()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminResponse> getAllAdmins() {
        return adminRepository.findByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(AdminResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminResponse createAdmin(String email, String password, String name, String phone, AdminRole role) {
        if (adminRepository.existsByEmailAndDeletedAtIsNull(email)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        Admin admin = Admin.create(email, passwordEncoder.encode(password), name, phone, role);
        return AdminResponse.from(adminRepository.save(admin));
    }

    @Transactional
    public AdminResponse updateAdmin(Long id, String name, String phone) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        admin.updateInfo(name, phone);
        return AdminResponse.from(adminRepository.save(admin));
    }

    @Transactional
    public AdminResponse changeAdminStatus(Long id, AdminStatus status) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        admin.changeStatus(status);
        return AdminResponse.from(adminRepository.save(admin));
    }
}
