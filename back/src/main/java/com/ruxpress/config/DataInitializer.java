package com.ruxpress.config;

import com.ruxpress.domain.admin.entity.Admin;
import com.ruxpress.domain.admin.entity.AdminRole;
import com.ruxpress.domain.admin.repository.AdminRepository;
import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.repository.SettlementAccountRepository;
import com.ruxpress.domain.user.entity.SignupType;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final SettlementAccountRepository settlementAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (adminRepository.count() == 0) {
            Admin superAdmin = Admin.create(
                    "admin@ruxpress.com",
                    passwordEncoder.encode("admin1234"),
                    "슈퍼관리자",
                    "010-0000-0000",
                    AdminRole.SUPER_ADMIN
            );
            adminRepository.save(superAdmin);

            Admin counselor = Admin.create(
                    "counselor@ruxpress.com",
                    passwordEncoder.encode("counsel1234"),
                    "상담사",
                    "010-1111-1111",
                    AdminRole.COUNSELOR
            );
            adminRepository.save(counselor);

            log.info("Seed admins created: admin@ruxpress.com / admin1234, counselor@ruxpress.com / counsel1234");
        }

        if (userRepository.count() == 0) {
            userRepository.save(User.create("user1@test.com", "테스트유저1", SignupType.EMAIL));
            userRepository.save(User.create("user2@test.com", "테스트유저2", SignupType.EMAIL));
            userRepository.save(User.create("user3@test.com", "구글유저", SignupType.GOOGLE));
            log.info("Seed users created: user1@test.com, user2@test.com, user3@test.com");
        }

        if (settlementAccountRepository.count() == 0 && adminRepository.count() > 0) {
            Admin first = adminRepository.findAll().getFirst();
            settlementAccountRepository.save(SettlementAccount.create(
                    "신한은행",
                    "12345678901234",
                    "럭스프레스(에스크로)",
                    "입금 시 요청 번호를 입금자명에 포함해 주세요.",
                    first.getId()));
            log.info("Seed settlement account created for local profile");
        }
    }
}
