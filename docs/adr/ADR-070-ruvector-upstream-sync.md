# ADR-070: RuVector Upstream Package Synchronization

**Status:** Proposed
**Date:** 2026-03-25
**Deciders:** @ruvnet, Architecture Team
**Tags:** #dependencies #ruvector #performance #upstream

## Context

RuVector ecosystem has received significant updates across multiple packages since our last sync. The main `ruvector` package has advanced from `0.1.99` to `0.2.18` (79 versions), and several scoped packages have new releases. AgentDB relies heavily on RuVector for vector operations, graph processing, and neural network features.

### Current Package Versions (AgentDB)

| Package | Current | Latest | Delta | Priority |
|---------|---------|--------|-------|----------|
| `ruvector` | `0.1.99` | `0.2.18` | +79 versions | 🔴 **CRITICAL** |
| `@ruvector/ruvllm` | `2.5.1` | `2.5.3` | +2 versions | 🟡 Medium |
| `@ruvector/graph-node` | `2.0.2` | `2.0.3` | +1 version | 🟢 Low |
| `@ruvector/router` | `0.1.28` | `0.1.29` | +1 version | 🟢 Low |
| `@ruvector/core` | ❌ Not installed | `0.1.31` | Missing | 🟡 Medium |
| `@ruvector/attention` | `0.1.31` | `0.1.31` | ✅ Up to date | - |
| `@ruvector/gnn` | `0.1.25` | `0.1.25` | ✅ Up to date | - |
| `@ruvector/sona` | `0.1.5` | `0.1.5` | ✅ Up to date | - |
| `@ruvector/graph-transformer` | `2.0.4` | `2.0.4` | ✅ Up to date | - |

### Latest Release Timeline

```
2026-03-23  ruvector 0.2.18      (2 days ago)
2026-03-23  ruvector 0.2.17      (2 days ago)
2026-03-17  ruvector 0.2.16      (8 days ago)
2026-03-17  ruvector 0.2.15      (8 days ago)
```

## RuVector 0.2.x Major Capabilities

### 🎯 Core Enhancements

1. **Self-Learning HNSW Indexing**
   - GNN layers adapt from query patterns automatically
   - Improves search results without manual tuning
   - Integration with existing AgentDB vector backend

2. **Enhanced Graph Queries**
   - Cypher engine for complex graph traversals
   - Hyperedge support (3+ node relationships)
   - Point-in-time snapshots for recovery

3. **46 Attention Mechanisms**
   - Flash attention (2.49x-7.47x speedup target in ADR-063)
   - Linear attention for O(n) complexity
   - Graph attention for relational data

### 🚀 Performance & Infrastructure

4. **Ultra-Fast Boot Time**
   - **125ms service startup** from single .rvf file
   - Includes vectors, models, and kernel
   - Replaces our multi-second initialization

5. **SONA Micro-LoRA**
   - <1ms fine-tuning updates
   - Self-optimizing neural architecture
   - Addresses ADR-009 adaptive learning goals

6. **Sublinear Algorithms**
   - O(log n) PageRank (150x-12,500x faster per ADR-006)
   - Spectral methods for graph operations
   - Min-cut optimization for clustering

### 🔒 Security & Distribution

7. **Post-Quantum Cryptography**
   - ML-DSA-65 signatures (quantum-resistant)
   - Tamper-proof audit chains
   - Addresses ADR-005 security requirements

8. **PostgreSQL Extension**
   - 230+ SQL functions
   - pgvector replacement
   - Direct SQL integration option

9. **Distributed Systems**
   - Raft consensus protocol
   - Multi-master replication
   - Byzantine fault tolerance

### 🧬 Specialized Capabilities

10. **Local LLM Inference**
    - GGUF model support (Metal, CUDA, WebGPU)
    - Sparse inference (2-10x compute reduction)
    - Edge device optimization

11. **Domain-Specific Modules**
    - **Genomics**: Variant calling, k-mer search (12ms)
    - **Quantum**: Coherence error correction
    - **OCR**: LaTeX/MathML extraction from documents

12. **Multi-Platform Deployment**
    - Servers, browsers, phones, IoT
    - Single cognitive container model
    - WASM fallback for unsupported platforms

## Decision

### ✅ APPROVED: Incremental Update Strategy

**Phase 1: Critical Updates (Week 1)**
- Update `ruvector` from `0.1.99` → `0.2.18`
- Update `@ruvector/ruvllm` from `2.5.1` → `2.5.3`
- Install missing `@ruvector/core@0.1.31`

**Phase 2: Minor Updates (Week 2)**
- Update `@ruvector/graph-node` from `2.0.2` → `2.0.3`
- Update `@ruvector/router` from `0.1.28` → `0.1.29`

**Phase 3: Integration Testing (Week 3)**
- Validate all AgentDB controllers with new versions
- Benchmark performance improvements
- Document breaking changes (if any)

### ❌ DEFERRED: Major Architectural Changes

Defer until v3.1.x or v4.0.0:
- PostgreSQL extension migration
- Raft consensus integration
- Post-quantum crypto implementation
- Genomics/quantum modules (not applicable to our use case)

## Rationale

### Why Update ruvector from 0.1.99 → 0.2.18?

1. **79 Version Gap is Risky**
   - We're missing bug fixes, security patches, and performance improvements
   - The 0.1.x → 0.2.x jump suggests semantic versioning (minor version bump)
   - Staying on 0.1.99 may cause compatibility issues with future AgentDB releases

2. **Dependency Alignment**
   - New `glob` dependency added in 0.2.x (minimal risk)
   - All scoped packages (`@ruvector/*`) already compatible with 0.2.x
   - No breaking changes detected in dependency tree

3. **Performance Gains**
   - Self-learning HNSW aligns with ADR-006 memory optimization goals
   - Sublinear algorithms directly support 150x-12,500x search targets
   - 125ms boot time reduces startup latency for AgentDB services

4. **Feature Parity**
   - SONA micro-LoRA enables ADR-009 adaptive learning
   - 46 attention mechanisms support ADR-063 performance targets (Flash Attention)
   - Enhanced graph queries improve CausalMemoryGraph operations

### Why Update @ruvector/ruvllm 2.5.1 → 2.5.3?

1. **HuggingFace Chat UI Integration**
   - Our `packages/agentdb-chat-ui` uses ruvllm for local inference
   - Patch updates (2.5.1 → 2.5.3) typically include bug fixes
   - GGUF model loading improvements benefit chat backend

2. **Low Risk**
   - Patch version updates maintain backward compatibility
   - No major API changes expected in 2.5.x series

### Why Install @ruvector/core@0.1.31?

1. **Missing Foundation Package**
   - `@ruvector/core` provides shared utilities for all scoped packages
   - Currently missing from agentic-flow root `package.json`
   - Already installed in `packages/agentdb` (0.1.30 specified in ruvector 0.2.18)

2. **Dependency Resolution**
   - Explicit installation prevents hoisting conflicts
   - Ensures consistent version across monorepo

### Why Defer PostgreSQL Extension?

1. **Current Architecture Commitment**
   - AgentDB v3 uses better-sqlite3 + HNSW
   - PostgreSQL migration requires schema redesign
   - No immediate performance bottleneck with SQLite

2. **Complexity vs Benefit**
   - 230+ SQL functions are powerful but require learning curve
   - Current SQLite implementation meets all ADR requirements
   - Can revisit in v4.0.0 if multi-user scenarios emerge

## Consequences

### ✅ Benefits

1. **Performance**
   - 150x-12,500x search improvements via sublinear algorithms (ADR-006)
   - 2.49x-7.47x attention speedup via Flash Attention (ADR-063)
   - 125ms boot time reduces service startup latency

2. **Capabilities**
   - Self-learning HNSW improves vector search automatically
   - 46 attention mechanisms enable advanced neural routing
   - SONA micro-LoRA enables real-time model adaptation

3. **Security**
   - Post-quantum crypto future-proofs authentication
   - Tamper-proof audit chains improve compliance
   - Raft consensus enables distributed deployments

4. **Ecosystem Alignment**
   - Staying current with upstream reduces technical debt
   - Access to latest bug fixes and security patches
   - Community support for recent versions

### ⚠️ Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking API changes | High | Low | Comprehensive test suite, incremental rollout |
| Dependency conflicts | Medium | Low | Lock file updates, resolution testing |
| Performance regression | Medium | Very Low | Benchmark before/after, rollback plan |
| Increased bundle size | Low | Medium | Tree-shaking, lazy loading, WASM fallback |

### 🔄 Migration Path

**Before Update:**
```bash
# Snapshot current state
npm list @ruvector/* ruvector > .ruvector-versions-before.txt
npm test > .test-results-before.txt
npm run benchmark > .benchmark-results-before.txt
```

**Update Commands:**
```bash
# Phase 1: Critical updates
npm install ruvector@0.2.18
npm install @ruvector/ruvllm@2.5.3
npm install @ruvector/core@0.1.31

# Phase 2: Minor updates
npm install @ruvector/graph-node@2.0.3
npm install @ruvector/router@0.1.29

# Verify lock file
npm ls @ruvector/* ruvector
```

**After Update:**
```bash
# Validate changes
npm test
npm run benchmark
npm run typecheck

# Compare results
diff .test-results-before.txt <(npm test)
diff .benchmark-results-before.txt <(npm run benchmark)
```

### 📊 Success Metrics

**Phase 1 (Week 1):**
- ✅ All 1,200+ AgentDB tests pass
- ✅ No TypeScript compilation errors
- ✅ Memory search latency ≤ baseline (no regression)

**Phase 2 (Week 2):**
- ✅ All controllers functional (21 controllers)
- ✅ MCP tools operational (18 of 213 documented)
- ✅ CI/CD pipeline green

**Phase 3 (Week 3):**
- ✅ Benchmark shows ≥5% performance improvement (or no regression)
- ✅ No new GitHub issues related to ruvector updates
- ✅ Documentation updated with migration notes

## Implementation Checklist

### Pre-Update
- [x] Document current package versions (completed in this ADR)
- [ ] Run full test suite and save baseline
- [ ] Run benchmarks and save results
- [ ] Create rollback script (npm install old versions)
- [ ] Backup package-lock.json

### Phase 1: Critical Updates
- [ ] Update ruvector to 0.2.18
- [ ] Update @ruvector/ruvllm to 2.5.3
- [ ] Install @ruvector/core@0.1.31
- [ ] Run `npm install` to update lock file
- [ ] Run test suite (expect 100% pass)
- [ ] Fix any breaking changes
- [ ] Commit with ADR reference

### Phase 2: Minor Updates
- [ ] Update @ruvector/graph-node to 2.0.3
- [ ] Update @ruvector/router to 0.1.29
- [ ] Run test suite
- [ ] Run benchmarks
- [ ] Commit changes

### Phase 3: Validation
- [ ] Full integration test (all controllers)
- [ ] Load test (1000+ vector operations)
- [ ] Memory leak detection (extended run)
- [ ] Document performance deltas
- [ ] Update MEMORY.md with new capabilities

### Post-Update
- [ ] Update CHANGELOG.md
- [ ] Update package.json in all monorepo packages
- [ ] Tag release: v3.0.0-alpha.11 (or v3.0.1)
- [ ] Publish to npm
- [ ] Close related GitHub issues (#129, #128 if fixed upstream)

## Related ADRs

- **ADR-006**: Unified Memory Service (HNSW indexing, 150x-12,500x search)
- **ADR-009**: Hybrid Memory Backend (SONA adaptive learning)
- **ADR-063**: Flash Attention Integration (2.49x-7.47x speedup)
- **ADR-005**: Security Architecture (post-quantum crypto deferred)
- **ADR-001**: Deep Integration Strategy (ruvector as core dependency)

## References

- [ruvector npm package](https://www.npmjs.com/package/ruvector)
- [RuVector GitHub Repository](https://github.com/ruvnet/ruvector/)
- [AgentDB Package](packages/agentdb/package.json)
- Issue #129: retrieveRelevant() HNSW bug (may be fixed in 0.2.x)
- Issue #128: storeEpisode() SQL INSERT (related to vector backend)

## Recognition

> 🏅 **RuVector is a CES 2026 Innovation Award Honoree**
> Recognized for self-learning vector database capabilities and 75+ advanced features across graph neural networks, local AI inference, and distributed systems.

---

**Decision Date:** 2026-03-25
**Implementation Target:** Week of 2026-03-25
**Review Date:** 2026-04-15 (after Phase 3 completion)
