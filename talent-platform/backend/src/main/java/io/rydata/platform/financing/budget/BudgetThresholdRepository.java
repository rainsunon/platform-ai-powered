package io.rydata.platform.financing.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetThresholdRepository extends JpaRepository<BudgetThreshold, String> {

    List<BudgetThreshold> findAllByOrderByIdAsc();
}
