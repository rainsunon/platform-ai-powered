package io.rydata.platform.financing.planning;

import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;

    public MilestoneService(MilestoneRepository milestoneRepository) {
        this.milestoneRepository = milestoneRepository;
    }

    public List<MilestoneResponse> list() {
        return milestoneRepository.findAllByOrderByIdAsc().stream().map(MilestoneResponse::from).toList();
    }

    @Transactional
    public MilestoneResponse update(String id, UpdateMilestoneRequest request) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MILESTONE_NOT_FOUND", "Milestone " + id + " was not found"));
        milestone.apply(
                request.title(),
                request.status(),
                request.statusColor(),
                request.budget(),
                request.spent(),
                request.phaseTarget(),
                request.validationNote());
        return MilestoneResponse.from(milestone);
    }
}
