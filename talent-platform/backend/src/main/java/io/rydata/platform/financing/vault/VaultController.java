package io.rydata.platform.financing.vault;

import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vault-files")
public class VaultController {

    private final VaultService vaultService;

    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }

    @GetMapping
    public List<VaultFileResponse> list(@RequestParam(required = false) @Nullable String category) {
        return vaultService.list(category);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VaultFileResponse create(@RequestBody CreateVaultFileRequest request) {
        return vaultService.create(request);
    }
}
