package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.admin.dto.request.AdminCreateRequest;
import com.ruxpress.domain.admin.dto.request.AdminStatusChangeRequest;
import com.ruxpress.domain.admin.dto.request.AdminUpdateRequest;
import com.ruxpress.domain.admin.dto.response.AdminResponse;
import com.ruxpress.domain.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/admins")
@RequiredArgsConstructor
public class AdminManagementController {

    private final AdminService adminService;

    @GetMapping
    public ApiResponse<List<AdminResponse>> listAdmins() {
        return ApiResponse.success(adminService.getAllAdmins());
    }

    @PostMapping
    public ApiResponse<AdminResponse> createAdmin(@Valid @RequestBody AdminCreateRequest request) {
        return ApiResponse.success(adminService.createAdmin(
                request.getEmail(), request.getPassword(),
                request.getName(), request.getPhone(), request.getRole()));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminResponse> updateAdmin(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateRequest request) {
        return ApiResponse.success(adminService.updateAdmin(id, request.getName(), request.getPhone()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusChangeRequest request) {
        return ApiResponse.success(adminService.changeAdminStatus(id, request.getStatus()));
    }
}
