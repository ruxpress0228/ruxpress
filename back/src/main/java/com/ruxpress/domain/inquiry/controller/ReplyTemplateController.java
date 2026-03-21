package com.ruxpress.domain.inquiry.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.inquiry.dto.request.ReplyTemplateRequest;
import com.ruxpress.domain.inquiry.dto.response.ReplyTemplateResponse;
import com.ruxpress.domain.inquiry.entity.ReplyTemplate;
import com.ruxpress.domain.inquiry.repository.ReplyTemplateRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/reply-templates")
@RequiredArgsConstructor
public class ReplyTemplateController {

    private final ReplyTemplateRepository repository;

    @GetMapping
    public ApiResponse<List<ReplyTemplateResponse>> list() {
        List<ReplyTemplateResponse> list = repository.findByDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc()
                .stream().map(ReplyTemplateResponse::from).collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<ReplyTemplateResponse> create(@Valid @RequestBody ReplyTemplateRequest req) {
        ReplyTemplate t = ReplyTemplate.create(req.getTitle(), req.getContent(), req.getCategory(), req.getSortOrder());
        return ApiResponse.success(ReplyTemplateResponse.from(repository.save(t)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ReplyTemplateResponse> update(@PathVariable Long id, @Valid @RequestBody ReplyTemplateRequest req) {
        ReplyTemplate t = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        t.update(req.getTitle(), req.getContent(), req.getCategory(), req.getSortOrder());
        return ApiResponse.success(ReplyTemplateResponse.from(repository.save(t)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        ReplyTemplate t = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        t.markDeleted();
        repository.save(t);
        return ApiResponse.success(null);
    }
}
