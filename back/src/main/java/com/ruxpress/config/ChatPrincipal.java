package com.ruxpress.config;

import com.ruxpress.domain.chat.entity.SenderType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.security.Principal;

@Getter
@RequiredArgsConstructor
public class ChatPrincipal implements Principal {

    private final Long id;
    private final SenderType senderType;

    @Override
    public String getName() {
        return senderType.name() + ":" + id;
    }
}
