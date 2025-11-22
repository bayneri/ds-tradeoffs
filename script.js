document.addEventListener('DOMContentLoaded', () => {
  const viewButtons = Array.from(document.querySelectorAll('[data-view-btn]'));
  const viewPanels = Array.from(document.querySelectorAll('[data-view-panel]'));
  const currentViewLabel = document.getElementById('current-view-label');
  const viewNames = {
    cap: 'CAP',
    pacelc: 'PACELC',
    spectrum: 'Consistency spectrum',
    quorum: 'Quorums',
    traffic: 'Traffic coping',
    durability: 'Durability',
    isolation: 'Isolation',
    locality: 'Locality',
    topology: 'Topology',
    retries: 'Retries',
    queueing: 'Queueing',
    cache: 'Cache',
    circuit: 'Circuit breaker',
    indexing: 'Indexing',
    schema: 'Schema',
    security: 'Security',
    tenancy: 'Resource isolation',
  };
  const deepDiveBody = document.getElementById('deep-dive-body');
  const deepDiveUses = document.getElementById('deep-dive-uses');
  const deepDiveLinks = document.getElementById('deep-dive-links');
  const deepDiveContent = {
    cap: {
      desc: 'CAP focuses on partitions: if the network splits, you choose consistency (wait/refuse) or availability (serve possibly stale). Partition tolerance is non-negotiable in distributed systems.',
      uses: ['You expect partitions and must be explicit about returning stale vs failing/queuing.', 'You need to explain why you cannot have C, A, and P simultaneously.'],
      links: [],
    },
    pacelc: {
      desc: 'PACELC extends CAP: during a partition choose Availability or Consistency (PA/PC); else choose Latency or Consistency (EL/EC). It frames steady-state versus failure trade-offs.',
      uses: ['You want language for steady-state (latency vs consistency) decisions.', 'You need to classify systems as PA/EL, PC/EC, etc.'],
      links: [],
    },
    spectrum: {
      desc: 'Consistency spectrum captures the continuum between eventual and strong. Strong adds coordination latency but reduces stale reads; eventual favors speed and availability.',
      uses: ['You need to communicate latency/freshness trade-offs to stakeholders.', 'You want to dial per-endpoint consistency levels.'],
      links: [],
    },
    quorum: {
      desc: 'Quorums (R/W/N) govern freshness and availability. R+W > N yields fresh reads; lowering quorums improves availability and latency but risks staleness.',
      uses: ['You tune Dynamo-style or Cassandra-style quorum configs.', 'You need to reason about R/W trade-offs under node loss.'],
      links: [],
    },
    traffic: {
      desc: 'Traffic coping balances tail latency and correctness under overload. Backpressure bounds work but can increase latency; shedding protects latency by dropping excess.',
      uses: ['You see 503s or timeouts during spikes and need a coping strategy.', 'You’re designing SLO-aware overload protection.'],
      links: [],
    },
    durability: {
      desc: 'Durability depends on replica count, regions, and replication mode. More replicas/regions harden data but add write latency and spend; async is faster but risks recent loss.',
      uses: ['You choose replication factors across AZs/regions.', 'You need to justify sync vs async replication to stakeholders.'],
      links: [],
    },
    isolation: {
      desc: 'Isolation levels prevent anomalies at coordination cost. Serializable is safest; lower levels allow more concurrency but permit phenomena like phantoms or write skew.',
      uses: ['You pick defaults for OLTP databases.', 'You need to explain why stricter isolation may slow throughput.'],
      links: [],
    },
    locality: {
      desc: 'Data locality trades latency versus freshness and replication cost. Centralized is simple but far; regional/edge reduce latency but require replication and manage staleness.',
      uses: ['You place data close to users to cut latency.', 'You decide between global tables vs region-local copies.'],
      links: [],
    },
    topology: {
      desc: 'Replication topology shapes conflicts and failover. Leader/follower is simple; multi-leader eases geo writes but needs conflict resolution; leaderless relies on quorums.',
      uses: ['You’re selecting a topology for a geo-distributed service.', 'You need to explain conflict risks of multi-leader to product teams.'],
      links: [],
    },
    retries: {
      desc: 'Retries require timeouts, backoff, and jitter. Too many retries can create retry storms and thundering herds; jitter smooths bursts and protects dependencies.',
      uses: ['You’re seeing retry storms or head-of-line blocking.', 'You’re tuning client SDKs or gateways for resilience.'],
      links: [],
    },
    queueing: {
      desc: 'Queueing strategies handle overload. Bounded + backpressure protects systems; unbounded hides pain and inflates tail latency; priority queues help VIPs but can starve others.',
      uses: ['You need to bound work to protect databases/services.', 'You need differentiated QoS without starving low-priority work.'],
      links: [],
    },
    cache: {
      desc: 'Caching reduces origin load and latency but risks staleness. TTL, hit rate, and write policy (through/back/refresh) determine freshness vs correctness risk.',
      uses: ['You offload read-heavy endpoints.', 'You decide on TTLs and write policy for a cache layer.'],
      links: [],
    },
    circuit: {
      desc: 'Circuit breakers prevent cascading failures by tripping on errors. Thresholds and cooldowns balance fast-fail vs serving fallbacks while dependencies recover.',
      uses: ['You see cascading failures from a slow dependency.', 'You want graceful degradation with fallbacks.'],
      links: [],
    },
    indexing: {
      desc: 'Indexes accelerate reads but increase write amplification and storage. For hot-write tables, keep indexes lean to avoid hurting write throughput.',
      uses: ['You need faster queries on read-heavy workloads.', 'You’re evaluating write impact of adding new indexes.'],
      links: [],
    },
    schema: {
      desc: 'Schema evolution safety comes from compatibility (backward/forward/full) and deploy order. Staged expand-migrate-contract reduces rollback pain and outage risk.',
      uses: ['You plan rolling deploys without downtime.', 'You must keep old and new versions interoperable.'],
      links: [],
    },
    security: {
      desc: 'Security posture (TLS termination and auth scheme) trades latency and ops complexity for risk reduction. E2E TLS + strong auth cuts exposure; edge termination is faster but trusts the mesh.',
      uses: ['You harden internal traffic paths.', 'You choose between JWT, sessions, or mTLS for services.'],
      links: [],
    },
    tenancy: {
      desc: 'Resource isolation caps per-tenant usage to avoid noisy neighbors. Strict caps protect fairness; burstable improves utilization but needs shaping and SLO guardrails.',
      uses: ['You operate multi-tenant SaaS and need fairness.', 'You’re defining per-tenant limits and burst policies.'],
      links: [],
    },
    default: {
      desc: 'Each view highlights a trade-off across consistency, availability, latency, durability, or safety. Adjust the controls to see how posture shifts for your scenario.',
      uses: ['You need language for explaining distributed system trade-offs.', 'You want to prototype settings before implementation.'],
      links: [],
    },
  };

  let currentView = null;

  function parseHash() {
    const raw = (location.hash || '').slice(1);
    if (!raw) return {};
    const params = new URLSearchParams(raw);
    return { view: params.get('view') || raw, picker: params.get('picker') || undefined };
  }

  function writeHash(view, picker) {
    const params = new URLSearchParams();
    if (picker) params.set('picker', picker);
    if (view) params.set('view', view);
    history.replaceState(null, '', `#${params.toString()}`);
  }

  function setActiveView(name) {
    if (!viewNames[name]) return;
    currentView = name;
    viewButtons.forEach(btn => {
      const active = btn.dataset.viewBtn === name;
      btn.classList.toggle('border-cyan-300/70', active);
      btn.classList.toggle('bg-cyan-500/20', active);
      btn.classList.toggle('text-white', active);
    });
    viewPanels.forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.viewPanel !== name);
    });
    if (currentViewLabel && viewNames[name]) currentViewLabel.textContent = viewNames[name];
    if (deepDiveBody) {
      const content = deepDiveContent[name] || deepDiveContent.default;
      deepDiveBody.textContent = content.desc;
      if (deepDiveUses) {
        deepDiveUses.innerHTML = '';
        (content.uses || []).forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          deepDiveUses.appendChild(li);
        });
      }
      if (deepDiveLinks) {
        deepDiveLinks.innerHTML = '';
        const links = content.links || [];
        deepDiveLinks.classList.toggle('hidden', links.length === 0);
        links.forEach(link => {
          const a = document.createElement('a');
          a.href = link.href;
          a.target = '_blank';
          a.rel = 'noreferrer';
          a.className = 'underline decoration-dotted hover:text-white';
          a.textContent = link.label;
          deepDiveLinks.appendChild(a);
        });
      }
    }
    // reflect in hash so refresh restores view
    const pickerState = pickerBody && pickerBody.classList.contains('hidden') ? 'hidden' : 'shown';
    writeHash(name, pickerState);
  }

  viewButtons.forEach(btn => btn.addEventListener('click', () => setActiveView(btn.dataset.viewBtn)));

  // Picker toggle
  const pickerBody = document.getElementById('picker-body');
  const togglePicker = document.getElementById('toggle-picker');
  if (pickerBody && togglePicker) {
    togglePicker.addEventListener('click', () => {
      pickerBody.classList.toggle('hidden');
      togglePicker.textContent = pickerBody.classList.contains('hidden') ? 'Show views' : 'Hide views';
      const pickerState = pickerBody.classList.contains('hidden') ? 'hidden' : 'shown';
      writeHash(currentView || 'cap', pickerState);
    });
  }

  // Jump links between views
  document.querySelectorAll('[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => setActiveView(btn.dataset.jump));
  });
  // Initialize view and picker from hash if present
  const { view: hashView, picker: pickerState } = parseHash();
  const initialView = viewNames[hashView] ? hashView : 'cap';
  if (pickerBody && togglePicker && pickerState === 'hidden') {
    pickerBody.classList.add('hidden');
    togglePicker.textContent = 'Show views';
  }
  setActiveView(initialView);

  function createMessenger(el) {
    if (!el) {
      return () => {};
    }
    return (text, duration = 4200) => {
      el.textContent = text;
      el.classList.remove('hidden');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.add('hidden'), duration);
    };
  }

  // CAP view
  const cap = {
    consistency: document.getElementById('cap-consistency'),
    availability: document.getElementById('cap-availability'),
    partition: document.getElementById('cap-partition'),
    stance: document.getElementById('cap-stance'),
    message: createMessenger(document.getElementById('cap-message')),
    reset: document.getElementById('cap-reset'),
    explain: document.getElementById('cap-explain'),
  };

  function updateCapStance() {
    const c = cap.consistency.checked;
    const a = cap.availability.checked;
    if (c && a) {
      cap.stance.textContent = 'Consistency + Availability';
      return;
    }
    if (c) {
      cap.stance.textContent = 'Prioritizing Consistency';
    } else if (a) {
      cap.stance.textContent = 'Prioritizing Availability';
    } else {
      cap.stance.textContent = 'None selected';
    }
  }

  function onCapChange(e) {
    const changed = e.target;
    if (cap.consistency.checked && cap.availability.checked) {
      const toClear = changed === cap.consistency ? cap.availability : cap.consistency;
      toClear.checked = false;
      cap.message('With partitions unavoidable, you can pick consistency or availability — not both.');
    } else {
      cap.message('Partition tolerance stays on. Pick one of consistency or availability.');
    }
    updateCapStance();
  }

  cap.consistency.addEventListener('change', onCapChange);
  cap.availability.addEventListener('change', onCapChange);
  cap.reset.addEventListener('click', () => {
    cap.consistency.checked = false;
    cap.availability.checked = false;
    cap.message('Choices cleared; partition tolerance remains on.');
    updateCapStance();
  });
  cap.explain.addEventListener('click', () => {
    cap.message('In a partition, you must sacrifice either consistency (serve stale data) or availability (refuse or delay). Partition tolerance is mandatory.');
  });
  cap.partition.checked = true;
  cap.partition.disabled = true;
  updateCapStance();

  // PACELC view
  const pacMessage = createMessenger(document.getElementById('pac-message'));
  const pacPartition = document.getElementById('pac-partition');
  const pacElse = document.getElementById('pac-else');
  const pacStance = document.getElementById('pac-stance');

  function updatePacStance() {
    const part = pacPartition.dataset.value;
    const el = pacElse.dataset.value;
    const parts = [];
    if (part) parts.push(`P${part === 'availability' ? 'A' : 'C'}`);
    if (el) parts.push(`E${el === 'latency' ? 'L' : 'C'}`);
    pacStance.textContent = parts.length ? parts.join('/') : 'Nothing selected';
  }

  function handlePacClick(btn) {
    const group = btn.dataset.pacGroup;
    const value = btn.dataset.value;
    const buttons = Array.from(document.querySelectorAll(`[data-pac-group="${group}"]`));
    buttons.forEach(b => b.classList.remove('border-cyan-300/70', 'bg-cyan-500/20', 'text-white'));
    btn.classList.add('border-cyan-300/70', 'bg-cyan-500/20', 'text-white');
    if (group === 'partition') {
      pacPartition.textContent = value === 'availability' ? 'Availability (PA)' : 'Consistency (PC)';
      pacPartition.dataset.value = value;
      pacMessage(`During partitions you're leaning ${value}.`);
    } else {
      pacElse.textContent = value === 'latency' ? 'Low latency (EL)' : 'Consistency (EC)';
      pacElse.dataset.value = value;
      pacMessage(`When healthy you're favoring ${value}.`);
    }
    updatePacStance();
  }

  document.querySelectorAll('.pac-btn').forEach(btn => btn.addEventListener('click', () => handlePacClick(btn)));
  document.getElementById('pac-reset').addEventListener('click', () => {
    document.querySelectorAll('.pac-btn').forEach(b => b.classList.remove('border-cyan-300/70', 'bg-cyan-500/20', 'text-white'));
    pacPartition.textContent = '—';
    pacElse.textContent = '—';
    delete pacPartition.dataset.value;
    delete pacElse.dataset.value;
    pacMessage('PACELC choices cleared.');
    updatePacStance();
  });
  document.getElementById('pac-explain').addEventListener('click', () => {
    pacMessage('PACELC: If partitioned pick A or C; else pick L or C. Common stances: PA/EL (AP systems), PC/EC (CP systems).');
  });
  updatePacStance();

  // Consistency spectrum view
  const spec = {
    slider: document.getElementById('spec-slider'),
    label: document.getElementById('spec-label'),
    read: document.getElementById('spec-read'),
    write: document.getElementById('spec-write'),
    stale: document.getElementById('spec-stale'),
    stance: document.getElementById('spec-stance'),
    message: createMessenger(document.getElementById('spec-message')),
    reset: document.getElementById('spec-reset'),
    explain: document.getElementById('spec-explain'),
  };

  function updateSpectrum() {
    const v = Number(spec.slider.value);
    const readLatency = Math.round(25 + v * 0.9);
    const writeLatency = Math.round(35 + v * 1.05);
    const staleRisk = Math.max(2, Math.round(65 - v * 0.55));
    const posture = v > 70 ? 'Strong-leaning' : v < 35 ? 'Eventual-leaning' : 'Balanced';
    spec.label.textContent = posture;
    spec.read.textContent = `${readLatency} ms`;
    spec.write.textContent = `${writeLatency} ms`;
    spec.stale.textContent = `${staleRisk}% stale risk`;
    spec.stance.textContent = posture;
  }

  spec.slider.addEventListener('input', () => {
    updateSpectrum();
    const leaning = spec.slider.value > 70 ? 'strong consistency' : spec.slider.value < 35 ? 'eventual consistency' : 'a balanced posture';
    spec.message(`Leaning toward ${leaning}.`);
  });

  spec.reset.addEventListener('click', () => {
    spec.slider.value = 60;
    updateSpectrum();
    spec.message('Reset to balanced posture.');
  });

  spec.explain.addEventListener('click', () => {
    spec.message('Stronger consistency increases coordination costs (latency) but reduces staleness; eventual consistency does the opposite.');
  });

  updateSpectrum();

  // Quorum tuning view
  const quorum = {
    n: document.getElementById('quorum-n'),
    r: document.getElementById('quorum-r'),
    w: document.getElementById('quorum-w'),
    nLabel: document.getElementById('quorum-n-label'),
    rLabel: document.getElementById('quorum-r-label'),
    wLabel: document.getElementById('quorum-w-label'),
    stance: document.getElementById('quorum-stance'),
    consistency: document.getElementById('quorum-consistency'),
    availability: document.getElementById('quorum-availability'),
    latency: document.getElementById('quorum-latency'),
    message: createMessenger(document.getElementById('quorum-message')),
    reset: document.getElementById('quorum-reset'),
    explain: document.getElementById('quorum-explain'),
  };

  function clampQuorumInputs() {
    const nVal = Number(quorum.n.value);
    quorum.r.max = nVal;
    quorum.w.max = nVal;
    if (Number(quorum.r.value) > nVal) quorum.r.value = nVal;
    if (Number(quorum.w.value) > nVal) quorum.w.value = nVal;
  }

  function updateQuorum() {
    clampQuorumInputs();
    const nVal = Number(quorum.n.value);
    const rVal = Number(quorum.r.value);
    const wVal = Number(quorum.w.value);

    quorum.nLabel.textContent = nVal;
    quorum.rLabel.textContent = rVal;
    quorum.wLabel.textContent = wVal;
    quorum.stance.textContent = `R${rVal}/W${wVal} on N${nVal}`;

    const sum = rVal + wVal;
    const strong = sum > nVal;
    quorum.consistency.textContent = strong
      ? `R+W = ${sum} > N (strong)`
      : `R+W = ${sum} ≤ N (eventual risk)`;

    const quorumPressure = (sum / (2 * nVal));
    const availabilityScore = Math.max(65, Math.round(99 - quorumPressure * 32));
    const latencyScore = Math.round(25 + (sum * 11));

    quorum.availability.textContent = `${availabilityScore}% under node loss`;
    quorum.latency.textContent = `${latencyScore} ms coord`;

    if (strong) {
      quorum.message('Reads will be fresh, but availability drops as quorums grow.');
    } else {
      quorum.message('Lower quorums improve availability and latency at the cost of possible staleness.');
    }
  }

  [quorum.n, quorum.r, quorum.w].forEach(input => input.addEventListener('input', updateQuorum));
  quorum.reset.addEventListener('click', () => {
    quorum.n.value = 3;
    quorum.r.value = 2;
    quorum.w.value = 2;
    updateQuorum();
    quorum.message('Reset to a common R2/W2 on N3 posture.');
  });
  quorum.explain.addEventListener('click', () => {
    quorum.message('Rule of thumb: R + W > N for strong reads. Increase R/W for freshness; lower them for availability and latency.');
  });
  updateQuorum();

  // Traffic coping view
  const traffic = {
    load: document.getElementById('traffic-load'),
    capacity: document.getElementById('traffic-capacity'),
    retries: document.getElementById('traffic-retries'),
    loadLabel: document.getElementById('traffic-load-label'),
    capacityLabel: document.getElementById('traffic-capacity-label'),
    retriesLabel: document.getElementById('traffic-retries-label'),
    stance: document.getElementById('traffic-stance'),
    drop: document.getElementById('traffic-drop'),
    latency: document.getElementById('traffic-latency'),
    experience: document.getElementById('traffic-experience'),
    message: createMessenger(document.getElementById('traffic-message')),
  };

  let trafficPolicy = 'backpressure';

  function setTrafficPolicy(policy, announce = true) {
    trafficPolicy = policy;
    document.querySelectorAll('.traffic-btn').forEach(btn => {
      const active = btn.dataset.trafficPolicy === policy;
      btn.classList.toggle('border-cyan-300/70', active);
      btn.classList.toggle('bg-cyan-500/20', active);
      btn.classList.toggle('text-white', active);
    });
    traffic.stance.textContent = policy === 'backpressure' ? 'Backpressure' : 'Shedding';
    if (announce) {
      traffic.message(policy === 'backpressure'
        ? 'Backpressure keeps work bounded; tail latency may rise.'
        : 'Shedding fails fast to protect latency at the cost of some requests.');
    }
    updateTraffic();
  }

  function updateTrafficLabels() {
    traffic.loadLabel.textContent = `${traffic.load.value} rps`;
    traffic.capacityLabel.textContent = `${traffic.capacity.value} rps`;
    traffic.retriesLabel.textContent = `x${traffic.retries.value}`;
  }

  function updateTraffic() {
    updateTrafficLabels();
    const load = Number(traffic.load.value);
    const capacity = Number(traffic.capacity.value);
    const retries = Number(traffic.retries.value);
    const backlog = Math.max(0, load - capacity);

    let dropRate = 0;
    let tailLatency;
    let experience;

    if (trafficPolicy === 'backpressure') {
      dropRate = 0;
      tailLatency = Math.round(90 + backlog * 1.4 + retries * 12);
      experience = backlog > 0 ? 'Slower but consistent responses' : 'Smooth flow';
    } else {
      dropRate = backlog > 0 ? Math.min(100, Math.round((backlog / load) * 100)) : 0;
      tailLatency = Math.round(85 + Math.max(0, backlog) * 0.4 + retries * 8);
      experience = dropRate > 0 ? 'Some requests dropped, others fast' : 'Fast responses';
    }

    tailLatency = Math.max(60, tailLatency);

    traffic.drop.textContent = `${dropRate}%`;
    traffic.latency.textContent = `${tailLatency} ms p99-ish`;
    traffic.experience.textContent = experience;
  }

  document.querySelectorAll('.traffic-btn').forEach(btn =>
    btn.addEventListener('click', () => setTrafficPolicy(btn.dataset.trafficPolicy))
  );
  [traffic.load, traffic.capacity, traffic.retries].forEach(input =>
    input.addEventListener('input', () => {
      updateTraffic();
      const policyLabel = trafficPolicy === 'backpressure' ? 'backpressure' : 'shed/fail-fast';
      traffic.message(`Load ${traffic.load.value} vs capacity ${traffic.capacity.value}; policy: ${policyLabel}.`);
    })
  );
  document.getElementById('traffic-reset').addEventListener('click', () => {
    traffic.load.value = 120;
    traffic.capacity.value = 100;
    traffic.retries.value = 2;
    setTrafficPolicy('backpressure', false);
    traffic.message('Traffic sliders reset. Backpressure stance restored.');
    updateTraffic();
  });
  document.getElementById('traffic-explain').addEventListener('click', () => {
    traffic.message('Backpressure slows producers to protect correctness; shedding drops excess to protect latency. Retries add load unless jittered/backed off.');
  });

  setTrafficPolicy('backpressure', false);
  updateTraffic();

  // Durability view
  const dura = {
    replicas: document.getElementById('dura-replicas'),
    regions: document.getElementById('dura-regions'),
    replicasLabel: document.getElementById('dura-replicas-label'),
    regionsLabel: document.getElementById('dura-regions-label'),
    stance: document.getElementById('dura-stance'),
    durability: document.getElementById('dura-durability'),
    latency: document.getElementById('dura-latency'),
    cost: document.getElementById('dura-cost'),
    message: createMessenger(document.getElementById('dura-message')),
  };

  if (dura.replicas && dura.regions) {
    let duraMode = 'sync';

    function setDuraMode(mode, announce = true) {
      duraMode = mode;
      document.querySelectorAll('.dura-btn').forEach(btn => {
        const active = btn.dataset.duraMode === mode;
        btn.classList.toggle('border-cyan-300/70', active);
        btn.classList.toggle('bg-cyan-500/20', active);
        btn.classList.toggle('text-white', active);
      });
      if (announce) {
        const msg = mode === 'sync'
          ? 'Sync waits for all acks; safest, slowest.'
          : mode === 'semi'
            ? 'Semi-sync waits for a quorum; middle ground.'
            : 'Async is fastest but risks last writes on failover.';
        dura.message(msg);
      }
      updateDurability();
    }

    function updateDurabilityLabels() {
      dura.replicasLabel.textContent = dura.replicas.value;
      dura.regionsLabel.textContent = dura.regions.value;
    }

    function updateDurability() {
      updateDurabilityLabels();
      const r = Number(dura.replicas.value);
      const regions = Number(dura.regions.value);
      const lossProbPerReplica = 0.02;
      const durabilityProb = 1 - Math.pow(lossProbPerReplica, r);
      const durabilityPct = Math.min(99.999, +(durabilityProb * 100).toFixed(3));

      const syncFactor = duraMode === 'sync' ? 1.0 : duraMode === 'semi' ? 0.65 : 0.35;
      const latencyBase = 40;
      const latency = Math.round(latencyBase + r * 12 * syncFactor + regions * 30 * syncFactor);

      const cost = (r * regions);
      const costString = `${cost}x baseline`;

      dura.durability.textContent = `${durabilityPct.toFixed(3)}% survive node loss`;
      dura.latency.textContent = `${latency} ms writes`;
      dura.cost.textContent = costString;
      dura.stance.textContent = `${r} replicas, ${regions} region${regions > 1 ? 's' : ''} (${duraMode})`;
    }

    [dura.replicas, dura.regions].forEach(input => input.addEventListener('input', () => {
      updateDurability();
      dura.message('Adjusting durability knobs.');
    }));
    document.querySelectorAll('.dura-btn').forEach(btn =>
      btn.addEventListener('click', () => setDuraMode(btn.dataset.duraMode))
    );
    document.getElementById('dura-reset').addEventListener('click', () => {
      dura.replicas.value = 3;
      dura.regions.value = 2;
      setDuraMode('sync', false);
      updateDurability();
      dura.message('Durability reset to 3 replicas across 2 regions, sync mode.');
    });
    document.getElementById('dura-explain').addEventListener('click', () => {
      dura.message('More replicas/regions improve durability. Sync waits for acks, semi-sync waits for quorum, async risks losing latest writes if a leader fails.');
    });
    setDuraMode('sync', false);
    updateDurability();
  }

  // Isolation view
  const isoLevels = {
    rc: {
      name: 'Read committed',
      anomalies: 'No dirty reads',
      latency: '+5-10%',
      throughput: 'High',
      msg: 'Good default; allows non-repeatable reads and phantom reads.',
    },
    rr: {
      name: 'Repeatable read',
      anomalies: 'No dirty or non-repeatable reads',
      latency: '+10-18%',
      throughput: 'Medium-high',
      msg: 'Prevents re-reading different data in a txn; phantoms still possible.',
    },
    si: {
      name: 'Snapshot isolation',
      anomalies: 'No dirty/non-repeatable/phantoms (per snapshot)',
      latency: '+15-22%',
      throughput: 'Medium',
      msg: 'Each txn reads from a snapshot; write-write conflicts abort.',
    },
    serializable: {
      name: 'Serializable',
      anomalies: 'No dirty, non-repeatable, or phantom reads',
      latency: '+25-40%',
      throughput: 'Lower',
      msg: 'Full isolation via locks or OCC; safest, most coordination.',
    },
  };

  const iso = {
    stance: document.getElementById('iso-stance'),
    anomalies: document.getElementById('iso-anomalies'),
    latency: document.getElementById('iso-latency'),
    throughput: document.getElementById('iso-throughput'),
    message: createMessenger(document.getElementById('iso-message')),
  };

  if (iso.stance && iso.anomalies) {
    function setIsolation(level, announce = true) {
      const meta = isoLevels[level];
      document.querySelectorAll('.iso-btn').forEach(btn => {
        const active = btn.dataset.iso === level;
        btn.classList.toggle('border-cyan-300/70', active);
        btn.classList.toggle('bg-cyan-500/20', active);
        btn.classList.toggle('text-white', active);
      });
      iso.stance.textContent = meta.name;
      iso.anomalies.textContent = meta.anomalies;
      iso.latency.textContent = meta.latency;
      iso.throughput.textContent = meta.throughput;
      if (announce) iso.message(meta.msg);
    }

    document.querySelectorAll('.iso-btn').forEach(btn =>
      btn.addEventListener('click', () => setIsolation(btn.dataset.iso))
    );
    document.getElementById('iso-reset').addEventListener('click', () => {
      setIsolation('serializable', false);
      iso.message('Reset to Serializable for maximum safety.');
    });
    document.getElementById('iso-explain').addEventListener('click', () => {
      iso.message('Isolation levels trade correctness for concurrency. Serializable blocks most anomalies; lower levels allow more concurrency with risks like phantoms or write skew.');
    });

    setIsolation('serializable', false);
  }

  // Locality view
  const locality = {
    stance: document.getElementById('locality-stance'),
    latency: document.getElementById('locality-latency'),
    cross: document.getElementById('locality-cross'),
    fresh: document.getElementById('locality-fresh'),
    ratio: document.getElementById('locality-ratio'),
    ratioLabel: document.getElementById('locality-ratio-label'),
    message: createMessenger(document.getElementById('locality-message')),
  };
  const localityMeta = {
    central: { name: 'Centralized', baseLat: 190, cross: 'High', fresh: 'Newest' },
    regional: { name: 'Per-region', baseLat: 130, cross: 'Medium', fresh: 'Minutes' },
    edge: { name: 'Edge cached', baseLat: 70, cross: 'Low reads / high write fan-out', fresh: 'Seconds-minutes' },
  };
  let localityPlacement = 'regional';
  function updateLocality() {
    if (!locality.ratio) return;
    const readPct = Number(locality.ratio.value);
    locality.ratioLabel.textContent = `${readPct}/${100 - readPct}`;
    document.querySelectorAll('.locality-btn').forEach(b => {
      const active = b.dataset.locality === localityPlacement;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const meta = localityMeta[localityPlacement];
    const latency = Math.max(30, Math.round(meta.baseLat - readPct * (localityPlacement === 'edge' ? 0.9 : 0.5)));
    const freshLabel = localityPlacement === 'central' ? 'Freshest' : localityPlacement === 'edge' ? 'Can be stale' : 'Moderately fresh';
    locality.latency.textContent = `${latency} ms median`;
    locality.cross.textContent = localityPlacement === 'edge' ? 'Writes replicate widely' : localityPlacement === 'central' ? 'Lots of cross-region reads' : 'Balanced replication';
    locality.fresh.textContent = freshLabel;
    locality.stance.textContent = meta.name;
  }
  if (locality.ratio) {
    document.querySelectorAll('.locality-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        localityPlacement = btn.dataset.locality;
        document.querySelectorAll('.locality-btn').forEach(b => {
          const active = b.dataset.locality === localityPlacement;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        locality.message(`${localityMeta[localityPlacement].name} selected.`);
        updateLocality();
      })
    );
    locality.ratio.addEventListener('input', () => {
      updateLocality();
      locality.message('Adjusted read/write split.');
    });
    document.getElementById('locality-reset').addEventListener('click', () => {
      localityPlacement = 'regional';
      locality.ratio.value = 70;
      locality.message('Locality reset to per-region.');
      document.querySelectorAll('.locality-btn').forEach(b => b.classList.remove('border-cyan-300/70', 'bg-cyan-500/20', 'text-white'));
      updateLocality();
    });
    document.getElementById('locality-explain').addEventListener('click', () => {
      locality.message('Closer data lowers latency but can add staleness and replication cost. Central is simplest but far for some users.');
    });
    updateLocality();
  }

  // Topology view
  const topologyMeta = {
    leader: {
      name: 'Leader/followers',
      conflicts: 'Low',
      failover: 'Needs election',
      complexity: 'Simple clients',
      msg: 'Good default; handle leader failover carefully.',
    },
    multi: {
      name: 'Multi-leader',
      conflicts: 'Medium (resolve)',
      failover: 'Fast local writes',
      complexity: 'Conflict resolution',
      msg: 'Great for geo-writes but conflict resolution required.',
    },
    leaderless: {
      name: 'Leaderless',
      conflicts: 'Managed by quorum',
      failover: 'Naturally resilient',
      complexity: 'Quorum client logic',
      msg: 'Highly available; tune quorums to avoid stale reads.',
    },
  };
  const topology = {
    stance: document.getElementById('topology-stance'),
    conflicts: document.getElementById('topology-conflicts'),
    failover: document.getElementById('topology-failover'),
    complexity: document.getElementById('topology-complexity'),
    message: createMessenger(document.getElementById('topology-message')),
  };
  if (topology.stance) {
    function setTopology(key, announce = true) {
      const meta = topologyMeta[key];
      document.querySelectorAll('.topology-btn').forEach(btn => {
        const active = btn.dataset.topology === key;
        btn.classList.toggle('border-cyan-300/70', active);
        btn.classList.toggle('bg-cyan-500/20', active);
        btn.classList.toggle('text-white', active);
      });
      topology.stance.textContent = meta.name;
      topology.conflicts.textContent = meta.conflicts;
      topology.failover.textContent = meta.failover;
      topology.complexity.textContent = meta.complexity;
      if (announce) topology.message(meta.msg);
    }
    document.querySelectorAll('.topology-btn').forEach(btn =>
      btn.addEventListener('click', () => setTopology(btn.dataset.topology))
    );
    document.getElementById('topology-reset').addEventListener('click', () => {
      setTopology('leader', false);
      topology.message('Reset to leader/followers.');
    });
    document.getElementById('topology-explain').addEventListener('click', () => {
      topology.message('Leader simplifies conflicts; multi-leader helps geo-writes; leaderless boosts availability with quorum rules.');
    });
    setTopology('leader', false);
  }

  // Retry view
  const retry = {
    count: document.getElementById('retry-count'),
    backoff: document.getElementById('retry-backoff'),
    jitter: document.getElementById('retry-jitter'),
    countLabel: document.getElementById('retry-count-label'),
    backoffLabel: document.getElementById('retry-backoff-label'),
    jitterLabel: document.getElementById('retry-jitter-label'),
    stance: document.getElementById('retry-stance'),
    latency: document.getElementById('retry-latency'),
    load: document.getElementById('retry-load'),
    herd: document.getElementById('retry-herd'),
    message: createMessenger(document.getElementById('retry-message')),
  };
  if (retry.count) {
    function updateRetry() {
      const c = Number(retry.count.value);
      const b = Number(retry.backoff.value);
      const j = Number(retry.jitter.value);
      retry.countLabel.textContent = c;
      retry.backoffLabel.textContent = b;
      retry.jitterLabel.textContent = j;
      retry.stance.textContent = `${c} retries`;
      const amp = 1 + c;
      const herd = Math.max(0, Math.round((c * (100 - j)) / 3));
      const p99 = Math.round(120 + c * 60 + b * 0.2 - j * 0.3);
      retry.latency.textContent = `${p99} ms p99`;
      retry.load.textContent = `${amp}x potential load`;
      retry.herd.textContent = `${herd}% herd risk`;
    }
    [retry.count, retry.backoff, retry.jitter].forEach(input =>
      input.addEventListener('input', () => {
        updateRetry();
        retry.message('Retries updated. Use jitter to reduce herd risk.');
      })
    );
    document.getElementById('retry-reset').addEventListener('click', () => {
      retry.count.value = 2;
      retry.backoff.value = 200;
      retry.jitter.value = 40;
      updateRetry();
      retry.message('Retry settings reset.');
    });
    document.getElementById('retry-explain').addEventListener('click', () => {
      retry.message('Bound retries with backoff and jitter. Too many retries can overload dependencies; prefer timeouts + jitter.');
    });
    updateRetry();
  }

  // Queueing view
  const queue = {
    size: document.getElementById('queue-size'),
    sizeLabel: document.getElementById('queue-size-label'),
    stance: document.getElementById('queue-stance'),
    latency: document.getElementById('queue-latency'),
    drop: document.getElementById('queue-drop'),
    starve: document.getElementById('queue-starve'),
    message: createMessenger(document.getElementById('queue-message')),
  };
  let queuePolicy = 'bounded';
  function updateQueue() {
    if (!queue.size) return;
    const size = Number(queue.size.value);
    document.querySelectorAll('.queue-btn').forEach(b => {
      const active = b.dataset.queue === queuePolicy;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    queue.sizeLabel.textContent = size;
    queue.stance.textContent = queuePolicy === 'priority' ? 'Priority queue' : queuePolicy === 'unbounded' ? 'Unbounded' : 'Bounded';
    const baseLatency = queuePolicy === 'unbounded' ? size * 1.5 : size * 0.9;
    const tail = Math.round(90 + baseLatency);
    const drop = queuePolicy === 'bounded' ? Math.max(0, Math.round((50 - size / 4))) : queuePolicy === 'priority' ? Math.max(0, 10 - size / 20) : 0;
    const starve = queuePolicy === 'priority' ? 30 : queuePolicy === 'unbounded' ? 5 : 15;
    queue.latency.textContent = `${tail} ms tail`;
    queue.drop.textContent = queuePolicy === 'unbounded' ? 'Hidden until OOM' : `${Math.max(drop, 0)}% under spike`;
    queue.starve.textContent = `${starve}% risk`;
  }
  if (queue.size) {
    document.querySelectorAll('.queue-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        queuePolicy = btn.dataset.queue;
        updateQueue();
        queue.message(`${queue.stance.textContent} selected.`);
      })
    );
    queue.size.addEventListener('input', () => {
      updateQueue();
      queue.message('Queue size adjusted.');
    });
    document.getElementById('queue-reset').addEventListener('click', () => {
      queuePolicy = 'bounded';
      queue.size.value = 80;
      updateQueue();
      queue.message('Queue stance reset to bounded.');
    });
    document.getElementById('queue-explain').addEventListener('click', () => {
      queue.message('Backpressure with bounded queues preserves stability; unbounded hides overload; priority risks starving lower tiers.');
    });
    updateQueue();
  }

  // Cache view
  const cache = {
    hit: document.getElementById('cache-hit'),
    ttl: document.getElementById('cache-ttl'),
    hitLabel: document.getElementById('cache-hit-label'),
    ttlLabel: document.getElementById('cache-ttl-label'),
    stance: document.getElementById('cache-stance'),
    origin: document.getElementById('cache-origin'),
    stale: document.getElementById('cache-stale'),
    risk: document.getElementById('cache-risk'),
    message: createMessenger(document.getElementById('cache-message')),
  };
  let cacheMode = 'through';
  function updateCache() {
    if (!cache.hit) return;
    document.querySelectorAll('.cache-btn').forEach(b => {
      const active = b.dataset.cacheMode === cacheMode;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const hit = Number(cache.hit.value);
    const ttl = Number(cache.ttl.value);
    cache.hitLabel.textContent = `${hit}%`;
    cache.ttlLabel.textContent = ttl;
    cache.stance.textContent = `${hit}% hit, ${ttl}s TTL`;
    const originLoad = Math.max(1, 100 - hit);
    const staleRisk = Math.round((ttl / 120) * 100);
    const correctness = cacheMode === 'through' ? 'Low' : cacheMode === 'refresh' ? 'Low/Med' : 'Higher';
    cache.origin.textContent = `${originLoad}% of traffic hits origin`;
    cache.stale.textContent = `${staleRisk}% stale risk`;
    cache.risk.textContent = correctness;
  }
  if (cache.hit) {
    document.querySelectorAll('.cache-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        cacheMode = btn.dataset.cacheMode;
        document.querySelectorAll('.cache-btn').forEach(b => {
          const active = b.dataset.cacheMode === cacheMode;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        cache.message(`Using ${btn.textContent} mode.`);
        updateCache();
      })
    );
    [cache.hit, cache.ttl].forEach(input =>
      input.addEventListener('input', () => {
        updateCache();
        cache.message('Cache settings updated.');
      })
    );
    document.getElementById('cache-reset').addEventListener('click', () => {
      cache.hit.value = 70;
      cache.ttl.value = 30;
      cacheMode = 'through';
      updateCache();
      cache.message('Cache reset to 70% hit, 30s TTL, write-through.');
    });
    document.getElementById('cache-explain').addEventListener('click', () => {
      cache.message('Higher TTL boosts hit rate but risks staleness. Write-through is safest; write-back is faster but riskier; refresh-ahead reduces staleness.');
    });
    updateCache();
  }

  // Circuit breaker view
  const circuit = {
    threshold: document.getElementById('circuit-threshold'),
    cooldown: document.getElementById('circuit-cooldown'),
    thresholdLabel: document.getElementById('circuit-threshold-label'),
    cooldownLabel: document.getElementById('circuit-cooldown-label'),
    stance: document.getElementById('circuit-stance'),
    trips: document.getElementById('circuit-trips'),
    impact: document.getElementById('circuit-impact'),
    recovery: document.getElementById('circuit-recovery'),
    message: createMessenger(document.getElementById('circuit-message')),
  };
  let circuitMode = 'failfast';
  function updateCircuit() {
    if (!circuit.threshold) return;
    document.querySelectorAll('.circuit-btn').forEach(b => {
      const active = b.dataset.circuitMode === circuitMode;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const t = Number(circuit.threshold.value);
    const cool = Number(circuit.cooldown.value);
    circuit.thresholdLabel.textContent = t;
    circuit.cooldownLabel.textContent = cool;
    circuit.stance.textContent = `${t}% threshold`;
    const trips = Math.max(0, Math.round((80 - t) / 2));
    const impact = circuitMode === 'fallback' ? 'Degraded responses' : 'Fast failures';
    const recovery = cool <= 30 ? 'Fast probes' : 'Slow recovery';
    circuit.trips.textContent = `${trips} trips avoided`;
    circuit.impact.textContent = impact;
    circuit.recovery.textContent = recovery;
  }
  if (circuit.threshold) {
    document.querySelectorAll('.circuit-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        circuitMode = btn.dataset.circuitMode;
        document.querySelectorAll('.circuit-btn').forEach(b => {
          const active = b.dataset.circuitMode === circuitMode;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        circuit.message(circuitMode === 'failfast' ? 'Failing fast to protect dependencies.' : 'Serving fallback while dependency recovers.');
        updateCircuit();
      })
    );
    [circuit.threshold, circuit.cooldown].forEach(input =>
      input.addEventListener('input', () => {
        updateCircuit();
        circuit.message('Circuit thresholds updated.');
      })
    );
    document.getElementById('circuit-reset').addEventListener('click', () => {
      circuit.threshold.value = 25;
      circuit.cooldown.value = 30;
      circuitMode = 'failfast';
      updateCircuit();
      circuit.message('Circuit reset to 25% threshold, 30s cooldown.');
    });
    document.getElementById('circuit-explain').addEventListener('click', () => {
      circuit.message('Circuit breakers trip when errors spike. Fail-fast preserves stability; fallbacks preserve UX with degraded data.');
    });
    updateCircuit();
  }

  // Indexing view
  const index = {
    count: document.getElementById('index-count'),
    hot: document.getElementById('index-hot'),
    countLabel: document.getElementById('index-count-label'),
    hotLabel: document.getElementById('index-hot-label'),
    stance: document.getElementById('index-stance'),
    read: document.getElementById('index-read'),
    write: document.getElementById('index-write'),
    storage: document.getElementById('index-storage'),
    message: createMessenger(document.getElementById('index-message')),
  };
  function updateIndex() {
    if (!index.count) return;
    const c = Number(index.count.value);
    const hot = Number(index.hot.value);
    index.countLabel.textContent = c;
    index.hotLabel.textContent = hot;
    index.stance.textContent = `${c} indexes`;
    const readLat = Math.max(5, Math.round(90 - c * 6));
    const writeLat = Math.round(40 + c * (hot * 0.25));
    const storage = `${Math.max(1, c * 8)}x`;
    index.read.textContent = `${readLat} ms reads`;
    index.write.textContent = `${writeLat} ms writes`;
    index.storage.textContent = storage;
  }
  if (index.count) {
    [index.count, index.hot].forEach(input =>
      input.addEventListener('input', () => {
        updateIndex();
        index.message('Index posture updated.');
      })
    );
    document.getElementById('index-reset').addEventListener('click', () => {
      index.count.value = 3;
      index.hot.value = 40;
      updateIndex();
      index.message('Index settings reset to 3 on moderately hot table.');
    });
    document.getElementById('index-explain').addEventListener('click', () => {
      index.message('Indexes speed reads but increase write amplification and storage. Tune per table based on access patterns.');
    });
    updateIndex();
  }

  // Schema view
  const schema = {
    stance: document.getElementById('schema-stance'),
    safety: document.getElementById('schema-safety'),
    velocity: document.getElementById('schema-velocity'),
    rollback: document.getElementById('schema-rollback'),
    message: createMessenger(document.getElementById('schema-message')),
  };
  const schemaCompatMeta = {
    backward: { name: 'Backward compat', safety: 'Good', velocity: 'Faster', rollback: 'Safer rollbacks', msg: 'Old consumers still work; beware forward-only fields.' },
    forward: { name: 'Forward compat', safety: 'Medium', velocity: 'Faster', rollback: 'Harder', msg: 'New consumers work with old data; upgrades first.' },
    both: { name: 'Full compatibility', safety: 'Strong', velocity: 'Moderate', rollback: 'Easier', msg: 'Safest approach; requires discipline on changes.' },
  };
  const schemaOrderMeta = {
    app: 'Ship app first, tolerate old schema.',
    db: 'Ship DB first, app lags behind.',
    staged: 'Staged deploy (expand/migrate/contract).',
  };
  let schemaCompat = 'both';
  let schemaOrder = 'staged';
  function updateSchema() {
    if (!schema.stance) return;
    document.querySelectorAll('.schema-btn').forEach(b => {
      const active = b.dataset.schema === schemaCompat;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    document.querySelectorAll('.schema-order-btn').forEach(b => {
      const active = b.dataset.schemaOrder === schemaOrder;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const compat = schemaCompatMeta[schemaCompat];
    schema.stance.textContent = compat.name;
    schema.safety.textContent = compat.safety;
    schema.velocity.textContent = compat.velocity;
    schema.rollback.textContent = schemaOrder === 'staged' ? 'Low pain' : schemaOrder === 'app' ? 'Medium' : 'Medium/high';
  }
  if (schema.stance) {
    document.querySelectorAll('.schema-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        schemaCompat = btn.dataset.schema;
        document.querySelectorAll('.schema-btn').forEach(b => {
          const active = b.dataset.schema === schemaCompat;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        schema.message(schemaCompatMeta[schemaCompat].msg);
        updateSchema();
      })
    );
    document.querySelectorAll('.schema-order-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        schemaOrder = btn.dataset.schemaOrder;
        document.querySelectorAll('.schema-order-btn').forEach(b => {
          const active = b.dataset.schemaOrder === schemaOrder;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        schema.message(schemaOrderMeta[schemaOrder]);
        updateSchema();
      })
    );
    document.getElementById('schema-reset').addEventListener('click', () => {
      schemaCompat = 'both';
      schemaOrder = 'staged';
      updateSchema();
      schema.message('Schema stance reset to full compatibility with staged deploys.');
    });
    document.getElementById('schema-explain').addEventListener('click', () => {
      schema.message('Prefer expand-migrate-contract with full compatibility to keep deploys safe. Deviations trade safety for speed.');
    });
    updateSchema();
  }

  // Security view
  const security = {
    stance: document.getElementById('security-stance'),
    latency: document.getElementById('security-latency'),
    risk: document.getElementById('security-risk'),
    ops: document.getElementById('security-ops'),
    message: createMessenger(document.getElementById('security-message')),
  };
  let securityTls = 'service';
  let securityAuth = 'jwt';
  function updateSecurity() {
    if (!security.stance) return;
    document.querySelectorAll('.security-tls-btn').forEach(b => {
      const active = b.dataset.securityTls === securityTls;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    document.querySelectorAll('.security-auth-btn').forEach(b => {
      const active = b.dataset.securityAuth === securityAuth;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const latency = securityTls === 'service' ? 'Highest' : securityTls === 'edge' ? 'Medium' : 'Low';
    const risk = securityTls === 'none' ? 'High' : securityTls === 'edge' ? 'Medium' : 'Low';
    const authComplexity = securityAuth === 'mtls' ? 'Higher ops' : securityAuth === 'jwt' ? 'Medium' : 'Lower';
    security.stance.textContent = `${securityTls === 'service' ? 'E2E TLS' : securityTls === 'edge' ? 'Edge TLS' : 'No TLS'} + ${securityAuth.toUpperCase()}`;
    security.latency.textContent = `${latency} overhead`;
    security.risk.textContent = `${risk} exposure`;
    security.ops.textContent = authComplexity;
  }
  if (security.stance) {
    document.querySelectorAll('.security-tls-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        securityTls = btn.dataset.securityTls;
        document.querySelectorAll('.security-tls-btn').forEach(b => {
          const active = b.dataset.securityTls === securityTls;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        security.message('TLS stance updated.');
        updateSecurity();
      })
    );
    document.querySelectorAll('.security-auth-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        securityAuth = btn.dataset.securityAuth;
        document.querySelectorAll('.security-auth-btn').forEach(b => {
          const active = b.dataset.securityAuth === securityAuth;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        security.message('Auth stance updated.');
        updateSecurity();
      })
    );
    document.getElementById('security-reset').addEventListener('click', () => {
      securityTls = 'service';
      securityAuth = 'jwt';
      updateSecurity();
      security.message('Security reset to E2E TLS + JWT.');
    });
    document.getElementById('security-explain').addEventListener('click', () => {
      security.message('E2E TLS plus strong auth reduces exposure. Edge termination is faster but trusts the mesh; mTLS strongest but heavier.');
    });
    updateSecurity();
  }

  // Tenancy view
  const tenancy = {
    cap: document.getElementById('tenancy-cap'),
    total: document.getElementById('tenancy-total'),
    capLabel: document.getElementById('tenancy-cap-label'),
    totalLabel: document.getElementById('tenancy-total-label'),
    stance: document.getElementById('tenancy-stance'),
    noise: document.getElementById('tenancy-noise'),
    util: document.getElementById('tenancy-util'),
    support: document.getElementById('tenancy-support'),
    message: createMessenger(document.getElementById('tenancy-message')),
  };
  let tenancyPolicy = 'strict';
  function updateTenancy() {
    if (!tenancy.cap) return;
    document.querySelectorAll('.tenancy-btn').forEach(b => {
      const active = b.dataset.tenancyPolicy === tenancyPolicy;
      b.classList.toggle('border-cyan-300/70', active);
      b.classList.toggle('bg-cyan-500/20', active);
      b.classList.toggle('text-white', active);
    });
    const capVal = Number(tenancy.cap.value);
    const totalVal = Number(tenancy.total.value);
    tenancy.capLabel.textContent = capVal;
    tenancy.totalLabel.textContent = totalVal;
    tenancy.stance.textContent = tenancyPolicy === 'strict' ? 'Strict caps' : 'Burstable';
    const noise = tenancyPolicy === 'strict' ? 'Low' : 'Medium';
    const utilScore = tenancyPolicy === 'burstable' ? Math.min(100, Math.round((capVal / totalVal) * 180)) : Math.round((capVal / totalVal) * 120);
    const supportLoad = tenancyPolicy === 'burstable' ? 'More tuning' : 'Simpler SLOs';
    tenancy.noise.textContent = noise;
    tenancy.util.textContent = `${utilScore}%`;
    tenancy.support.textContent = supportLoad;
  }
  if (tenancy.cap) {
    document.querySelectorAll('.tenancy-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        tenancyPolicy = btn.dataset.tenancyPolicy;
        document.querySelectorAll('.tenancy-btn').forEach(b => {
          const active = b.dataset.tenancyPolicy === tenancyPolicy;
          b.classList.toggle('border-cyan-300/70', active);
          b.classList.toggle('bg-cyan-500/20', active);
          b.classList.toggle('text-white', active);
        });
        tenancy.message('Policy updated.');
        updateTenancy();
      })
    );
    [tenancy.cap, tenancy.total].forEach(input =>
      input.addEventListener('input', () => {
        updateTenancy();
        tenancy.message('Caps updated.');
      })
    );
    document.getElementById('tenancy-reset').addEventListener('click', () => {
      tenancyPolicy = 'strict';
      tenancy.cap.value = 80;
      tenancy.total.value = 300;
      updateTenancy();
      tenancy.message('Tenancy reset to strict caps.');
    });
    document.getElementById('tenancy-explain').addEventListener('click', () => {
      tenancy.message('Strict caps protect neighbors; burstable improves utilization but needs shaping and SLOs.');
    });
    updateTenancy();
  }

});
