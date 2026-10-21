package io.rydata.platform.financing.ledger;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, String> {

    @EntityGraph(attributePaths = "tags")
    @Query("SELECT transaction FROM LedgerTransaction transaction WHERE transaction.id = :id")
    Optional<LedgerTransaction> findDetailedById(@Param("id") String id);

    @EntityGraph(attributePaths = "tags")
    Optional<LedgerTransaction> findByRef(String ref);

    @EntityGraph(attributePaths = "tags")
    List<LedgerTransaction> findAllByOrderByCreatedAtDesc();
}
