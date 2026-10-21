package io.rydata.platform.financing.identity;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, String> {

    @EntityGraph(attributePaths = "authorizedEntities")
    List<TeamMember> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "authorizedEntities")
    @Query("SELECT member FROM TeamMember member WHERE member.id = :id")
    Optional<TeamMember> findDetailedById(@Param("id") String id);
}
