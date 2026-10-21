package io.rydata.platform.financing.ledger;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LedgerTagRepository extends JpaRepository<LedgerTag, String> {

    List<LedgerTag> findAllByOrderByNameAsc();
}
