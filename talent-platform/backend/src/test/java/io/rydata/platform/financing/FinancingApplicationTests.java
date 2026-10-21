package io.rydata.platform.financing;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FinancingApplicationTests {

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.register(registry);
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Seeded ledger returns the frontend transaction snapshot")
    void listsSeededTransactions() throws Exception {
        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-Id"))
                .andExpect(jsonPath("$[?(@.id == 'tx-1')].ref").value("TXN-90241"))
                .andExpect(jsonPath("$[?(@.id == 'tx-1')].type").value("inflow"))
                .andExpect(jsonPath("$[?(@.id == 'tx-1')].amount").value(64200.0))
                .andExpect(jsonPath("$[?(@.id == 'tx-1')].tags[0]").value("SaaS"));
    }

    @Test
    @DisplayName("Budget reports use the MyBatis spend query")
    void budgetReportsLoadSpend() throws Exception {
        mockMvc.perform(get("/api/v1/budget-reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].threshold.id").exists())
                .andExpect(jsonPath("$[0].currentSpend").exists());
    }

    @Test
    @DisplayName("Journal posts are rejected while the fiscal period is locked")
    void createTransactionWhileLocked() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"client":"Strata Cloud Corp","amount":1200.00}
                                """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(header().string("Content-Type", containsString("application/problem+json")))
                .andExpect(jsonPath("$.errorCode").value("PERIOD_LOCKED"));
    }

    @Test
    @DisplayName("Members cannot approve ledger transactions")
    void memberCannotApprove() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/tx-2/approvals").header("X-Actor-Role", "member"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("An unknown actor role is rejected")
    void unknownRole() throws Exception {
        mockMvc.perform(get("/api/v1/transactions").header("X-Actor-Role", "root"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("UNKNOWN_ROLE"));
    }

    @Test
    @DisplayName("Client planners do not receive internal firm vault files")
    void plannerVaultIsScoped() throws Exception {
        mockMvc.perform(get("/api/v1/vault-files").header("X-Actor-Role", "client_planner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 'vf-1')].title").value("FY2024 Audited Balance Sheet & P&L"))
                .andExpect(jsonPath("$[?(@.category == 'firm')]").isEmpty());
    }

    @Test
    @DisplayName("Client roles do not see invoice margin fields")
    void marginsAreMasked() throws Exception {
        mockMvc.perform(get("/api/v1/invoices/INV-2024-8841").header("X-Actor-Role", "client_admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(142800.0))
                .andExpect(jsonPath("$.directCost").doesNotExist())
                .andExpect(jsonPath("$.grossProfit").doesNotExist())
                .andExpect(jsonPath("$.lineItems[0].title").value("Data Engine Cluster Architecture"))
                .andExpect(jsonPath("$.lineItems[1].amount").value(79800.0));
    }

    @Test
    @DisplayName("Audit changes are stored as a jsonb document")
    void auditDeltaIsJson() throws Exception {
        mockMvc.perform(get("/api/v1/audit-events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 'aud-105')].delta[0].field").value("AccountCode"))
                .andExpect(jsonPath("$[?(@.id == 'aud-105')].delta[2].current").value("SaaS; Retainer; Tier-1"));
    }

    @Test
    void contextLoads() {
        org.assertj.core.api.Assertions.assertThat(mockMvc).isNotNull();
    }
}
