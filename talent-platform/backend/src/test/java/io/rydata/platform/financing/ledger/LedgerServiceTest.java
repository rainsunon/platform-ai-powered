package io.rydata.platform.financing.ledger;

import io.rydata.platform.financing.budget.BudgetThresholdRepository;
import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.compliance.AuditTrail;
import io.rydata.platform.financing.compliance.FiscalPeriodService;
import io.rydata.platform.financing.config.FinancingProperties;
import io.rydata.platform.financing.governance.GovernanceItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private LedgerTransactionRepository transactionRepository;
    @Mock
    private LedgerQueryMapper ledgerQueryMapper;
    @Mock
    private LedgerTagRepository ledgerTagRepository;
    @Mock
    private BudgetThresholdRepository budgetThresholdRepository;
    @Mock
    private GovernanceItemRepository governanceItemRepository;
    @Mock
    private FiscalPeriodService fiscalPeriodService;
    @Mock
    private AuditTrail auditTrail;
    @Mock
    private BusinessIds businessIds;

    private LedgerService ledgerService;

    @BeforeEach
    void setUp() {
        FinancingProperties properties = new FinancingProperties(
                new BigDecimal("10000.00"),
                "Elena Rostova (Executive VP)",
                "https://api.rydata.io/errors/");
        ledgerService = new LedgerService(
                transactionRepository,
                ledgerQueryMapper,
                ledgerTagRepository,
                budgetThresholdRepository,
                governanceItemRepository,
                fiscalPeriodService,
                auditTrail,
                businessIds,
                new LedgerPostingPolicy(properties));
    }

    @Test
    @DisplayName("Small inflows post as verified without dual control")
    void createsVerifiedInflow() {
        when(businessIds.next("tx-")).thenReturn("tx-new");
        when(businessIds.transactionRef()).thenReturn("TXN-10001");
        when(transactionRepository.save(any(LedgerTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LedgerTransactionResponse response = ledgerService.create(new CreateTransactionRequest(
                "Acme Global Holdings", "Strata Cloud Corp", "1200-AR", "Retainer",
                new BigDecimal("5000.00"), "Swift Wire", java.util.List.of("SaaS")));

        assertThat(response.type()).isEqualTo("inflow");
        assertThat(response.status()).isEqualTo("verified");
        assertThat(response.approved()).isTrue();
        assertThat(response.requiresDualSign()).isFalse();
        verify(auditTrail).record(any());
    }

    @Test
    @DisplayName("Outflows above the dual-sign threshold are flagged")
    void flagsLargeOutflow() {
        when(businessIds.next("tx-")).thenReturn("tx-large");
        when(businessIds.transactionRef()).thenReturn("TXN-10002");
        when(budgetThresholdRepository.findAllByOrderByIdAsc()).thenReturn(java.util.List.of());
        when(transactionRepository.save(any(LedgerTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LedgerTransactionResponse response = ledgerService.create(new CreateTransactionRequest(
                null, null, null, null, new BigDecimal("-15000.00"), null, null));

        assertThat(response.type()).isEqualTo("outflow");
        assertThat(response.status()).isEqualTo("threshold_flag");
        assertThat(response.requiresDualSign()).isTrue();
        assertThat(response.approved()).isFalse();
        assertThat(response.tags()).containsExactly("General");
    }

    @Test
    @DisplayName("A locked fiscal period rejects journal posts")
    void rejectsCreateWhenPeriodLocked() {
        org.mockito.Mockito.doThrow(new BusinessRuleViolationException("PERIOD_LOCKED", "locked"))
                .when(fiscalPeriodService).requireOpen();

        assertThatThrownBy(() -> ledgerService.create(new CreateTransactionRequest(
                null, null, null, null, new BigDecimal("10.00"), null, null)))
                .isInstanceOf(BusinessRuleViolationException.class);

        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Approving a missing transaction reports not found")
    void approveMissingTransaction() {
        when(transactionRepository.findDetailedById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ledgerService.approve("missing"))
                .isInstanceOf(io.rydata.platform.financing.common.exception.ResourceNotFoundException.class);
    }
}
