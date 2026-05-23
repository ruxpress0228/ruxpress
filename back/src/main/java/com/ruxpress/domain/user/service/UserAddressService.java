package com.ruxpress.domain.user.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.user.dto.request.UserAddressCreateRequest;
import com.ruxpress.domain.user.dto.request.UserAddressUpdateRequest;
import com.ruxpress.domain.user.dto.response.UserAddressResponse;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserAddress;
import com.ruxpress.domain.user.repository.UserAddressRepository;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAddressService {

    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserAddressResponse> listMyAddresses(Long userId) {
        return userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId).stream()
                .map(UserAddressResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAddressResponse create(Long userId, UserAddressCreateRequest request) {
        boolean wantDefault = Boolean.TRUE.equals(request.getIsDefault());
        long count = userAddressRepository.countByUserId(userId);
        boolean isDefault = wantDefault || count == 0;
        if (isDefault) {
            clearDefaultForUser(userId);
        }

        UserAddress entity = UserAddress.create(
                userId,
                trimToNull(request.getLabel()),
                trimToNull(request.getRecipientName()),
                trimToNull(request.getRecipientPhone()),
                trimToNull(request.getPostalCode()),
                request.getAddressLine1().trim(),
                trimToNull(request.getAddressLine2()),
                isDefault);
        UserAddress saved = userAddressRepository.save(entity);
        if (isDefault) {
            syncUserProfileAddressFrom(userId, saved);
        }
        return UserAddressResponse.from(saved);
    }

    @Transactional
    public UserAddressResponse update(Long userId, Long addressId, UserAddressUpdateRequest request) {
        UserAddress a = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "배송지를 찾을 수 없습니다."));
        a.setLabel(trimToNull(request.getLabel()));
        a.setRecipientName(trimToNull(request.getRecipientName()));
        a.setRecipientPhone(trimToNull(request.getRecipientPhone()));
        a.setPostalCode(trimToNull(request.getPostalCode()));
        a.setAddressLine1(request.getAddressLine1().trim());
        a.setAddressLine2(trimToNull(request.getAddressLine2()));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultForUser(userId);
            a.setDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault()) && a.isDefault()) {
            a.setDefault(false);
        }

        UserAddress saved = userAddressRepository.save(a);
        if (saved.isDefault()) {
            syncUserProfileAddressFrom(userId, saved);
        }
        return UserAddressResponse.from(saved);
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        UserAddress a = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "배송지를 찾을 수 없습니다."));
        boolean wasDefault = a.isDefault();
        userAddressRepository.delete(a);
        if (wasDefault) {
            List<UserAddress> rest = userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
            if (!rest.isEmpty()) {
                UserAddress first = rest.get(0);
                first.setDefault(true);
                userAddressRepository.save(first);
                syncUserProfileAddressFrom(userId, first);
            }
        }
    }

    @Transactional
    public UserAddressResponse setDefault(Long userId, Long addressId) {
        UserAddress a = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "배송지를 찾을 수 없습니다."));
        if (a.isDefault()) {
            return UserAddressResponse.from(a);
        }
        clearDefaultForUser(userId);
        a.setDefault(true);
        UserAddress saved = userAddressRepository.save(a);
        syncUserProfileAddressFrom(userId, saved);
        return UserAddressResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public UserAddress getOwnedAddressOrThrow(Long userId, Long addressId) {
        return userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "배송지를 찾을 수 없습니다."));
    }

    private void clearDefaultForUser(Long userId) {
        for (UserAddress x : userAddressRepository.findByUserIdAndIsDefaultTrue(userId)) {
            x.setDefault(false);
            userAddressRepository.save(x);
        }
    }

    private void syncUserProfileAddressFrom(Long userId, UserAddress a) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        user.updateProfile(
                user.getNickname(),
                a.getPostalCode(),
                a.getAddressLine1(),
                a.getAddressLine2());
        userRepository.save(user);
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
