package io.rydata.platform.financing.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    List<Invoice> findAllByOrderByCreatedAtDesc();

    @Query("SELECT invoice FROM Invoice invoice WHERE invoice.id = :id")
    Optional<Invoice> findDetailedById(@Param("id") String id);
}
