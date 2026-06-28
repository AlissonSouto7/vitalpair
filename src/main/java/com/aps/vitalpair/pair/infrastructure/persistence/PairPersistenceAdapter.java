package com.aps.vitalpair.pair.infrastructure.persistence;

import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Implementa a porta de saída de persistência de pares sobre Spring Data JPA. */
@Component
public class PairPersistenceAdapter implements PairRepositoryPort {

    private final PairJpaRepository repository;
    private final PairPersistenceMapper mapper;

    public PairPersistenceAdapter(PairJpaRepository repository, PairPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Pair save(Pair pair) {
        return mapper.toDomain(repository.save(mapper.toEntity(pair)));
    }

    @Override
    public Optional<Pair> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Pair> findByInviteCode(String inviteCode) {
        return repository.findByInviteCode(inviteCode).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
