package io.rydata.platform.financing.ledger;

import io.rydata.platform.financing.budget.BudgetMonitor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Complex queries use MyBatis. Statements live in {@code classpath:mapper}
 * and run on the local PostgreSQL datasource.
 */
@Mapper
public interface LedgerQueryMapper {

    List<LedgerSearchRow> search(
            @Param("entity") String entity,
            @Param("client") String client,
            @Param("accountCode") String accountCode,
            @Param("tag") String tag,
            @Param("query") String query);

    List<BudgetMonitor.SpendFact> findSpendFacts();
}
