package com.nmn.example.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nmn.example.model.Product;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
class ProductRepositoryIT {

  @Container
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:16-alpine")
          .withDatabaseName("test")
          .withUsername("test")
          .withPassword("test");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired private ProductRepository productRepository;

  @Test
  @DisplayName("search returns products matching name filter")
  void search_withNameFilter_returnsMatchingProducts() {
    productRepository.save(new Product("Blue Widget", "A blue widget", new BigDecimal("9.99")));
    productRepository.save(new Product("Red Gadget", "A red gadget", new BigDecimal("14.99")));

    Page<Product> result =
        productRepository.search("widget", null, PageRequest.of(0, 10));

    assertThat(result.getContent()).hasSize(1);
    assertThat(result.getContent().get(0).getName()).isEqualTo("Blue Widget");
  }

  @Test
  @DisplayName("existsByNameIgnoreCase returns true when name exists")
  void existsByNameIgnoreCase_whenNameExists_returnsTrue() {
    productRepository.save(new Product("Widget Pro", "Pro widget", new BigDecimal("29.99")));

    assertThat(productRepository.existsByNameIgnoreCase("widget pro")).isTrue();
    assertThat(productRepository.existsByNameIgnoreCase("WIDGET PRO")).isTrue();
  }
}
