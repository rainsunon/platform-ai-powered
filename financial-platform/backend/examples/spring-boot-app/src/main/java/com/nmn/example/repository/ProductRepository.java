package com.nmn.example.repository;

import com.nmn.example.model.Product;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

  Page<Product> findAllByActiveTrue(Pageable pageable);

  @Query(
      "SELECT p FROM Product p WHERE p.active = true"
          + " AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))"
          + " AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
  Page<Product> search(
      @Param("name") String name,
      @Param("maxPrice") BigDecimal maxPrice,
      Pageable pageable);

  boolean existsByNameIgnoreCase(String name);
}
