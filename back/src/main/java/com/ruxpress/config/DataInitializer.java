package com.ruxpress.config;

import com.ruxpress.domain.admin.entity.Admin;
import com.ruxpress.domain.admin.entity.AdminRole;
import com.ruxpress.domain.admin.repository.AdminRepository;
import com.ruxpress.domain.user.entity.SignupType;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Objects;

@Slf4j
@Component
@Profile({"local", "docker"})
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (adminRepository.count() == 0) {
            Admin superAdmin = Admin.create(
                    "admin@ruxpress.com",
                    passwordEncoder.encode("admin1234"),
                    "슈퍼관리자",
                    "010-0000-0000",
                    AdminRole.SUPER_ADMIN);
            adminRepository.save(Objects.requireNonNull(superAdmin));

            Admin counselor = Admin.create(
                    "counselor@ruxpress.com",
                    passwordEncoder.encode("counsel1234"),
                    "상담사",
                    "010-1111-1111",
                    AdminRole.COUNSELOR);
            adminRepository.save(Objects.requireNonNull(counselor));

            Admin admin1 = Admin.create(
                    "admin1@test.com",
                    passwordEncoder.encode("admin1"),
                    "슈퍼 관리자",
                    "010-0000-0001",
                    AdminRole.SUPER_ADMIN);
            adminRepository.save(Objects.requireNonNull(admin1));

            Admin admin2 = Admin.create(
                    "admin2@test.com",
                    passwordEncoder.encode("admin2"),
                    "상담사",
                    "010-1111-1112",
                    AdminRole.COUNSELOR);
            adminRepository.save(Objects.requireNonNull(admin2));

            log.info("Seed admins created");
        }

        if (userRepository.count() == 0) {
            userRepository.save(Objects.requireNonNull(User.createWithPassword(
                    "test1@test.com",
                    passwordEncoder.encode("test1"),
                    "테스트사용자1",
                    SignupType.EMAIL)));
            userRepository.save(Objects.requireNonNull(User.createWithPassword(
                    "test2@test.com",
                    passwordEncoder.encode("test2"),
                    "테스트사용자2",
                    SignupType.EMAIL)));
            userRepository.save(Objects.requireNonNull(User.createWithPassword(
                    "test3@test.com",
                    passwordEncoder.encode("test3"),
                    "테스트사용자3",
                    SignupType.EMAIL)));

            log.info("Seed users created");
        }

        // 입금 계좌·원장 시드는 BankTransferTestDataSeeder 에서 처리
    }
}
