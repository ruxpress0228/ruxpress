package com.ruxpress.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserStatsResponse {

    private final long totalUsers;
    private final long activeUsers;
    private final long suspendedUsers;
    private final long withdrawnUsers;
    private final long newUsersToday;
}
