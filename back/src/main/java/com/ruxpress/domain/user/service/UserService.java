package com.ruxpress.domain.user.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.user.dto.response.UserResponse;
import com.ruxpress.domain.user.dto.response.UserStatsResponse;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserStatus;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String keyword, UserStatus status, Pageable pageable) {
        Page<User> page;

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasStatus = status != null;

        if (hasKeyword && hasStatus) {
            page = userRepository.searchByKeywordAndStatus(keyword.trim(), status, pageable);
        } else if (hasKeyword) {
            page = userRepository.searchByKeyword(keyword.trim(), pageable);
        } else if (hasStatus) {
            page = userRepository.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(status, pageable);
        } else {
            page = userRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);
        }

        List<UserResponse> content = page.getContent().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());

        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse changeUserStatus(Long id, UserStatus newStatus) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        user.changeStatus(newStatus);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats() {
        long total = userRepository.countByDeletedAtIsNull();
        long active = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.ACTIVE);
        long suspended = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.SUSPENDED);
        long withdrawn = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.WITHDRAWN);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long newToday = userRepository.countByCreatedAtAfterAndDeletedAtIsNull(todayStart);

        return new UserStatsResponse(total, active, suspended, withdrawn, newToday);
    }
}
