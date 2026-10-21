package io.rydata.platform.financing.vault;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VaultFileRepository extends JpaRepository<VaultFile, String> {

    List<VaultFile> findAllByOrderByCreatedAtDesc();
}
