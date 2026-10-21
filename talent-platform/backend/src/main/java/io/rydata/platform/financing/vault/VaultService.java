package io.rydata.platform.financing.vault;

import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.Texts;
import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.common.security.CurrentActor;
import io.rydata.platform.financing.common.security.PlatformRole;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class VaultService {

    private final VaultFileRepository vaultFileRepository;
    private final BusinessIds businessIds;
    private final CurrentActor currentActor;

    public VaultService(VaultFileRepository vaultFileRepository, BusinessIds businessIds, CurrentActor currentActor) {
        this.vaultFileRepository = vaultFileRepository;
        this.businessIds = businessIds;
        this.currentActor = currentActor;
    }

    public List<VaultFileResponse> list(@Nullable String category) {
        PlatformRole role = currentActor.role();
        String requested = Texts.blankToNull(category);
        return vaultFileRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(file -> visible(file, role))
                .filter(file -> requested == null || file.getCategory().wire().equalsIgnoreCase(requested))
                .map(VaultFileResponse::from)
                .toList();
    }

    @Transactional
    public VaultFileResponse create(CreateVaultFileRequest request) {
        VaultCategory category = VaultCategory.PUBLIC;
        if (request.category() != null && !request.category().isBlank()) {
            category = VaultCategory.fromWire(request.category())
                    .orElseThrow(() -> new BusinessRuleViolationException(
                            "UNKNOWN_CATEGORY", "Vault category must be public, admin, or firm"));
        }
        VaultFile file = VaultFile.upload(
                businessIds.next("vf-"),
                Texts.orDefault(request.title(), "Client Uploaded Statement.pdf"),
                Texts.orDefault(request.subtitle(), "Uploaded via Secure Client Dropbox"),
                category,
                Texts.orDefault(request.fiscalPeriod(), "FY 2025 WIP"),
                Texts.orDefault(request.fileSize(), "1.4 MB"));
        return VaultFileResponse.from(vaultFileRepository.save(file));
    }

    private static boolean visible(VaultFile file, PlatformRole role) {
        return switch (file.getCategory()) {
            case FIRM -> role.canSeeFirmVault();
            case ADMIN -> role.canSeeAdminVault();
            case PUBLIC -> true;
        };
    }
}
