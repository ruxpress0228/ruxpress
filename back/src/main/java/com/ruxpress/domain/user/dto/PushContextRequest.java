package com.ruxpress.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PushContextRequest {

    private String fcmToken;
    private String manufacturer;
    private String model;
    private String brand;
    private String device;
    private String versionRelease;
    private Integer sdkInt;
    private Boolean notificationsEnabled;
}
