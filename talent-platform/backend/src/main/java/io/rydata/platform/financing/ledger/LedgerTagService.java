package io.rydata.platform.financing.ledger;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class LedgerTagService {

    private final LedgerTagRepository ledgerTagRepository;

    public LedgerTagService(LedgerTagRepository ledgerTagRepository) {
        this.ledgerTagRepository = ledgerTagRepository;
    }

    public List<String> list() {
        return ledgerTagRepository.findAllByOrderByNameAsc().stream().map(LedgerTag::getName).toList();
    }

    @Transactional
    public String add(CreateLedgerTagRequest request) {
        String name = request.name().trim();
        return ledgerTagRepository.findById(name)
                .orElseGet(() -> ledgerTagRepository.save(LedgerTag.of(name)))
                .getName();
    }
}
