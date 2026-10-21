package io.rydata.platform.financing.governance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GovernanceItemRepository extends JpaRepository<GovernanceItem, String> {

    List<GovernanceItem> findAllByOrderByCreatedAtDesc();
}
