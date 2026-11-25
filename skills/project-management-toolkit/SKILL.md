---
name: "project-management-toolkit"
description: "Project management methods, formulas and playbooks for planning, estimating, CPM scheduling, earned value, risk, contracts, agile metrics and status reports. Not for syncing tracker tickets."
---

# Project Management Toolkit

Act as an experienced project manager. Use this skill when the user asks you to plan a project, write a charter, break down scope (WBS), estimate, build or check a schedule, run budget or earned-value numbers, build a risk register, choose a contract type, plan stakeholders and communication, forecast agile delivery, write a status or health report, build a business case, or review any of these.

Boundaries: syncing tickets in Jira, Trello or GitHub belongs to tracker skills; a dashboard of *this coding session's* progress belongs to a status-update skill. This skill is about managing the user's *project*.

## How to work

1. **Classify the ask** and jump to the matching workflow below (A to J).
2. **Get context before producing anything:** project type (software, AI/data, construction, regulated, etc.), delivery approach (predictive, agile, hybrid), size (budget, duration, team), hard constraints (fixed date, fixed price, regulation), and the audience. In a repo, read README, docs/, existing plans and backlog exports first. Ask only the questions whose answers change the output; otherwise assume and label each assumption.
3. **Compute, never eyeball.** Do every calculation with `pm_calc.py` (at the end of this file) or Python. Show formula, inputs, result and what it means.
4. **Give ranges, not single numbers,** with a confidence level and the assumptions they rest on.
5. **Lead with the answer:** the decision, forecast or recommendation first, detail after.
6. **Tailor the weight:** a one-page charter and a Kanban board for small work; full baselines and governance for large or regulated work.
7. **Save deliverables as files** when working in a repo: `docs/pm/<artifact>.md`, registers as Markdown tables or CSV. Use the templates below.
8. **Verify before handing over:** rerun the numbers, check signs (CPI < 1 = over budget), the WBS 100% rule, one Accountable per RACI row, an owner and response for every high risk.

## Choosing the delivery approach

| Situation | Approach |
| --- | --- |
| Stable requirements, costly change (construction, hardware, fixed contracts) | Predictive (waterfall, V-model, Stage-Gate) |
| Uncertain requirements, cheap feedback (software, AI, digital products) | Agile (Scrum, Kanban, XP) |
| Mixed: fixed parts plus uncertain parts | Hybrid: stage gates on top, sprints underneath; agile software inside a predictive hardware or regulatory schedule |
| Improving an existing process | Six Sigma DMAIC (Define, Measure, Analyze, Improve, Control) |
| New product with go/kill decisions | Stage-Gate (gates: go / kill / hold / recycle) |
| Resource-constrained, multitasking teams | Critical Chain (CCPM) with project, feeding and resource buffers |
| Data, ML or AI | CRISP-DM / PMI CPMAI: business understanding, data understanding, data preparation, model development, model evaluation, operationalization; iterate |

Tools for the choice: **Stacey matrix** (agreement on requirements vs. certainty of technology: near both = predictive, far = agile/experiment, very far = chaos). **Cynefin**: clear (follow best practice), complicated (expert analysis), complex (probe-sense-respond, agile), chaotic (act to stabilize), confused. **Agile suitability check:** customer available for frequent feedback, work splits into small valuable slices, empowered team, contract allows changing scope.

## Workflows

### A. New project plan

1. **Charter:** purpose, SMART objectives and success criteria, high-level scope and exclusions, key risks, milestones, budget envelope, stakeholders, PM authority, sponsor sign-off.
2. **Stakeholders:** register + power/interest grid + engagement matrix (current vs. desired).
3. **Scope:** requirements (with a traceability matrix if regulated), scope statement, WBS (100% rule, deliverables as nouns, work packages 8 to 80 hours), WBS dictionary. Agile: epics, features, user stories (INVEST), Definition of Ready and Done, story map, MVP.
4. **Estimates:** workflow B.
5. **Schedule:** workflow C. Milestones, critical path, buffers, P50/P80 dates.
6. **Budget:** bottom-up cost + contingency reserve (from risk EMV) = cost baseline (BAC); + management reserve = project budget.
7. **Risk register:** workflow E.
8. **RACI, communication plan, meeting cadence, governance** (sponsor, steering committee, change control board, tolerances, escalation path).
9. **Change control process:** request, log, impact analysis on scope/time/cost/quality/risk/benefits, decision, update baselines, communicate.
10. **KPIs and reporting:** what is measured, how often, RAG thresholds; benefits plan with owner and measures.

### B. Estimate

- Pick the technique: analogous (early, little detail, low accuracy), parametric (unit rate x quantity, needs good history), bottom-up (detailed WBS, highest accuracy), three-point (when uncertainty matters), relative sizing (story points, T-shirt sizes, planning poker), reference class forecasting (big or novel work; counters optimism bias).
- Three-point: PERT mean = (O + 4M + P) / 6; triangular = (O + M + P) / 3; sigma = (P - O) / 6. For a path, add means and add variances, then sigma_path = sqrt(sum of sigma^2).
- Confidence: plus or minus 1 sigma = 68.3%, 2 sigma = 95.5%, 3 sigma = 99.7%. One-sided: P(finish <= mean + 1 sigma) = 84.1%; + 2 sigma = 97.7%.
- Duration = effort / (people x availability x hours per day). Fixed-duration tasks do not shrink with more people. Brooks' law: adding people late makes software later.
- Accuracy bands: ROM -25% to +75%; budget -10% to +25%; definitive -5% to +10%. AACE classes 5 (concept, worst about -50%/+100%) to 1 (check estimate, worst about -10%/+15%). Software cone of uncertainty: 0.25x to 4x at concept, 0.5x to 2x at approved definition, 0.67x to 1.5x at requirements complete.
- Learning curve: T_n = T_1 x n^b, b = log(rate) / log 2.
- Always separate the **estimate** (likely), the **target** (wanted) and the **commitment** (promised). Record the basis of estimate.

### C. Schedule (critical path method)

1. Activities from work packages, dependencies (FS default; SS, FF, SF rare), leads and lags, milestones.
2. Forward pass: ES = max EF of predecessors; EF = ES + D. Backward pass: LF = min LS of successors; LS = LF - D (day-0 convention; with day-1, EF = ES + D - 1).
3. Total float = LS - ES; free float = ES(next) - EF. Critical path = zero (or lowest) float; negative float = deadline already missed.
4. Compression: **crashing** (add resources to critical work, cheapest crash cost slope first; slope = (crash cost - normal cost) / (normal time - crash time)) or **fast-tracking** (overlap, adds risk). Recheck the critical path after each step: it can shift.
5. Resource leveling (may move the end date) vs. smoothing (within float only).
6. Merge bias: chance all converging paths are on time = product of their chances.
7. Monte Carlo on three-point ranges; commit externally to P80, not P50.
8. Health checks (DCMA 14-point): missing logic <= 5%, leads 0, lags <= 5%, FS links >= 90%, hard constraints <= 5%, float or duration > 44 working days <= 5%, negative float 0, BEI = completed / due >= 0.95, CPLI = (CP length + total float) / CP length >= 0.95.

### D. Cost and earned value health check

Inputs: BAC, PV, EV (= % complete x BAC), AC. Run `evm()`.

- CV = EV - AC; SV = EV - PV; CPI = EV / AC; SPI = EV / PV.
- EAC: BAC / CPI (default: current efficiency continues); AC + (BAC - EV) (one-off variance); AC + (BAC - EV) / (CPI x SPI) (both problems persist); AC + bottom-up ETC (plan invalid).
- ETC = EAC - AC; VAC = BAC - EAC; TCPI = (BAC - EV) / (BAC - AC) or (BAC - EV) / (EAC - AC).
- Earned schedule: ES = time when the plan expected the current EV; SPI(t) = ES / AT; SV(t) = ES - AT; forecast duration = planned duration / SPI(t). Prefer SPI(t) late in a project: SPI drifts to 1.0 at the end even when late.
- EV credit methods: 0/100 (short tasks), 50/50 or 20/80, weighted milestones, units completed, level of effort (EV = PV), apportioned effort. Never use % of budget spent as % complete (forces CPI = 1).
- Reserves: contingency (known unknowns, inside baseline) vs. management reserve (unknown unknowns, outside baseline, needs approval).

### E. Risk register

1. Identify: brainstorming, Delphi, checklists, lessons learned, assumption analysis, SWOT, PESTLE or TECOP prompt lists, risk breakdown structure, pre-mortem.
2. Write each as: "Because of <cause>, <event> may occur, leading to <effect>."
3. Score probability x impact (1 to 5 each; bands 1-4 low, 5-9 medium, 10-14 high, 15-25 critical, unless the organization defines others). Also note proximity, manageability, connectivity.
4. Quantify the big ones: EMV = probability x impact (threats negative). Sum EMV = basis for contingency. Decision trees for choices: EMV per branch = sum(p x payoff) - branch cost, solved right to left.
5. Respond. Threats: escalate, avoid, transfer (insurance, fixed price, bonds, warranties), mitigate, accept (active = contingency, passive). Opportunities: escalate, exploit, share, enhance, accept.
6. Each risk: owner, trigger, response, contingency and fallback plans, residual and secondary risks, status, review date.
7. Track: risk burndown (total exposure over time), watch list, risk-adjusted backlog in agile.

### F. Agile forecast

- Velocity = done points per sprint, average of last 3 to 5. Sprints left = remaining points / velocity; give a range with best and worst velocity.
- Capacity = people x days x focus hours (focus factor usually 60 to 80%), minus leave.
- Little's law: cycle time = WIP / throughput. Flow efficiency = active time / lead time (5 to 15% is common).
- Better: Monte Carlo on historical weekly throughput ("85% chance of 40 items by date X").
- Prioritize: WSJF = cost of delay / job size (cost of delay = business value + time criticality + risk reduction or opportunity enablement); RICE = reach x impact x confidence / effort; MoSCoW; Kano.
- Agile EVM: EV = (done points / release points) x release budget; PV = (sprints done / total sprints) x release budget.
- Delivery health: sprint goal success, say/do ratio, escaped defects, DORA metrics (deployment frequency, lead time for changes, change failure rate, recovery time from failed deployments).

### G. Business case and project selection

- PV = FV / (1 + r)^n. NPV = sum CF_t / (1 + r)^t - C_0 (main yardstick: > 0, highest wins). IRR = rate where NPV = 0 (must beat the hurdle). ROI = (benefits - costs) / costs. Payback = investment / annual inflow (also discounted). BCR = PV benefits / PV costs (> 1).
- Ignore sunk costs; state opportunity cost; weighted scoring for non-financial benefits.
- R&D: ECV = [(NPV x P_commercial - commercialization cost) x P_technical] - development cost.
- Always state the discount rate and horizon, and show sensitivity (best, base, worst).

### H. Procurement and contract choice

| Type | Cost risk | Use when |
| --- | --- | --- |
| Firm fixed price | Seller (most) | Clear, stable scope |
| Fixed price incentive fee | Mostly seller | Clear scope, some cost uncertainty |
| Fixed price + economic price adjustment | Shared | Multi-year, inflation exposure |
| Time and materials (with not-to-exceed cap) | Buyer (moderate) | Small, urgent or staff augmentation |
| Cost plus incentive fee | Mostly buyer | Uncertain scope, want efficiency |
| Cost plus award fee | Buyer | Performance judged subjectively |
| Cost plus fixed fee | Buyer | Research, high uncertainty |
| Cost plus % of cost | Buyer (most) | Avoid |

- Incentive fee = target fee + (target cost - actual cost) x seller share. FPIF price = actual cost + fee, capped at ceiling. PTA = (ceiling - target price) / buyer share + target cost.
- Make or buy break-even = up-front build cost / (monthly buy cost - monthly run cost).
- Documents: SOW, RFI, RFQ, RFP, IFB; MSA, SLA, NDA; weighted vendor scoring; bidder conference; independent cost estimate.
- Terms to check: privity, force majeure, liquidated damages, retention, bonds, warranty, limitation of liability, termination for convenience vs. default, IP ownership, data protection, audit rights, change orders, dispute resolution (negotiate, mediate, arbitrate).
- Negotiation: know your BATNA and reservation point, estimate theirs and the ZOPA; principled negotiation (people vs. problem, interests not positions, options for mutual gain, objective criteria); trade, don't concede.

### I. Status report

Lead with overall RAG + trend + the forecast finish and cost. Then: accomplishments, next steps, milestones (baseline vs. forecast), EAC vs. BAC, top risks and issues with owners, decisions needed by date. RAG thresholds agreed in advance (e.g. green within 5% of baseline, amber 5 to 10%, red > 10%). Watch for watermelon reporting (green outside, red inside). Escalate early with facts, options and a recommendation.

### J. Review an existing plan

Check and report findings ranked by impact:
- Objectives SMART and tied to benefits with an owner?
- WBS 100% rule, deliverable-based, work packages estimable; scope exclusions stated?
- Estimates: basis documented, ranges given, history used, owners estimated their own work?
- Schedule: DCMA checks, realistic critical path, buffers, resource over-allocation, merge points?
- Budget: contingency tied to risk EMV, management reserve separate, cash flow per period?
- Risks: specific cause-event-effect statements, owners, responses, triggers; top risks quantified?
- Governance: decision rights, tolerances, change control, RACI with one A per row?
- Stakeholders: key players engaged, communication plan by audience?
- Quality: acceptance criteria, Definition of Done, test strategy?
- Closure: handover, hypercare, lessons learned, benefits tracking after go-live?

## Interpretation rules

| Metric | Good | Warning |
| --- | --- | --- |
| CPI, SPI, SPI(t) | >= 1.0 | < 0.95 needs action; < 0.9 is serious |
| TCPI | <= CPI | > 1.1 rarely achievable: re-baseline or cut scope |
| BEI, CPLI | >= 0.95 | < 0.95 |
| Total float on critical path | >= 0 | Negative = deadline missed already |
| Cpk | >= 1.33 (1.67 critical) | < 1.0 produces defects |
| Benefit-cost ratio | > 1 | < 1 destroys value |
| Flow efficiency | rising | < 10% = waiting dominates |

## Frameworks quick reference

- **PMBOK Guide 8th edition (PMI, Nov 2025).** Six principles: adopt a holistic view, focus on value, embed quality, be an accountable leader, integrate sustainability, build an empowered culture. Seven performance domains: governance, scope, schedule, finance, stakeholders, resources, risk. Five focus areas: initiating, planning, executing, monitoring and controlling, closing. **PMP exam since 9 July 2026:** People 33%, Process 41%, Business Environment 26%.
- **PMBOK 6 (still common):** 10 knowledge areas (integration, scope, schedule, cost, quality, resource, communications, risk, procurement, stakeholder) and 5 process groups.
- **Scrum (Guide 2020):** Product Owner, Scrum Master, Developers; Sprint (<= 1 month), Planning (<= 8 h), Daily Scrum (15 min), Review (<= 4 h), Retrospective (<= 3 h); Product Backlog -> Product Goal, Sprint Backlog -> Sprint Goal, Increment -> Definition of Done.
- **Kanban:** visualize, limit WIP, manage flow, explicit policies, feedback loops, evolve. **XP:** pairing, TDD, CI, refactoring, small releases. **Lean wastes (DOWNTIME):** defects, overproduction, waiting, non-used talent, transportation, inventory, motion, extra processing. **SAFe:** release trains, 8 to 12 week PIs, PI Planning, WSJF.
- **PRINCE2 7:** principles (continued business justification, learn from experience, defined roles/responsibilities/relationships, manage by stages, manage by exception, focus on products, tailor); practices (business case, organizing, plans, quality, risk, issues, progress); processes (starting up, directing, initiating, controlling a stage, managing product delivery, managing a stage boundary, closing).
- **Org structures:** functional -> weak matrix -> balanced matrix -> strong matrix -> projectized (PM authority rises). **PMO types:** supportive, controlling, directive.
- **Team and leadership:** Tuckman (forming, storming, norming, performing, adjourning); Maslow; Herzberg (hygiene vs. motivators); McGregor X/Y; McClelland (achievement, affiliation, power); Vroom (motivation = expectancy x instrumentality x valence); Pink (autonomy, mastery, purpose); power types (legitimate, reward, coercive, expert, referent, informational); servant, transformational, transactional, situational (directing, coaching, supporting, delegating) leadership; Goleman EI (self-awareness, self-regulation, motivation, empathy, social skills); psychological safety.
- **Conflict (Thomas-Kilmann):** collaborate/problem-solve (best when time allows), compromise, accommodate/smooth, compete/force (emergencies), avoid/withdraw (cool-off). Typical sources: schedules, priorities, resources, technical opinions.
- **Stakeholders and communication:** power/interest grid (manage closely, keep satisfied, keep informed, monitor); salience (power, legitimacy, urgency); engagement levels (unaware, resistant, neutral, supportive, leading); channels = n(n - 1) / 2; methods interactive, push, pull; RACI (one A per row), RASCI, DACI, RAPID.
- **Quality:** quality vs. grade; PDCA; cost of quality (prevention + appraisal vs. internal + external failure); 7 tools (fishbone, flowchart, check sheet, Pareto, histogram, control chart, scatter); control limits = mean +/- 3 sigma, rule of seven; DPMO = defects / (units x opportunities) x 1,000,000 (3.4 = six sigma); Cp = (USL - LSL) / 6 sigma; Cpk = min(USL - mean, mean - LSL) / 3 sigma; FMEA RPN = severity x occurrence x detection (1 to 1,000; severity 9-10 always priority); 5 Whys; rolled throughput yield = product of step yields.
- **Change models:** ADKAR (awareness, desire, knowledge, ability, reinforcement); Kotter 8 steps; Lewin (unfreeze, change, refreeze); Bridges (ending, neutral zone, new beginning).
- **Decision tools:** weighted decision matrix, EMV, decision trees, Pareto, pre-mortem, reversible vs. irreversible decisions, OODA, Eisenhower matrix for personal priorities.

## Project-type playbooks

- **Software / IT:** Scrum or Kanban in a roadmap; environments dev -> test -> UAT -> prod; NFRs (performance, security, availability) from day one; test levels unit -> integration -> system -> regression -> performance -> security -> UAT; go/no-go checklist, cutover plan, rollback criteria, hypercare; ITIL change advisory board for production changes; metrics: velocity, cycle time, escaped defects, DORA, SLA uptime (99.9% = about 8.8 h downtime a year).
- **AI, ML and data:** start from the business decision and its baseline metric; feasibility gate on data availability, legality and quality; PoC -> pilot -> production with exit criteria agreed up front (avoid PoC purgatory); time-boxed experiments, data preparation often the biggest effort; statistical acceptance criteria on a held-out evaluation set (precision = TP / (TP + FP), recall = TP / (TP + FN), F1 = 2PR / (P + R)); for generative AI also groundedness or hallucination rate, human-review rate, latency, cost per request; value = volume x time saved x loaded hourly cost - run costs; risks: data, privacy, bias, drift, prompt injection, vendor or model changes, regulation (e.g. EU AI Act), adoption; governance: model risk management, human-in-the-loop for high-impact decisions, versioned data/models/prompts, monitoring and retraining plan; after launch track accuracy, drift, override rate, adoption and the promised business KPI.
- **Enterprise systems (ERP, core platforms):** fit-gap (configure before customize), data migration with mock loads and reconciliation, SIT and UAT, cutover strategy (big bang, phased, parallel run, pilot), change management and training.
- **Construction and engineering:** predictive; delivery methods (design-bid-build, design-build, EPC, CM at risk, IPD); contracts (FIDIC, NEC4, JCT, AIA); BOQ, take-offs, AACE classes; P6 schedules, look-aheads, Last Planner (PPC = completed / planned assignments), line of balance; RFIs, submittals, punch lists, as-builts, commissioning; variations, extension of time, delay analysis (time impact, windows), liquidated damages, retention; safety LTIFR = lost-time injuries x 1,000,000 / hours, TRIR = recordables x 200,000 / hours.
- **Manufacturing and hardware:** Stage-Gate or NPI; EVT -> DVT -> PVT; APQP, PPAP, DFMEA, PFMEA, DFM/DFA; BOM, tooling and supplier lead times; takt = available time / demand; OEE = availability x performance x quality (about 85% world class); first-pass and rolled throughput yield.
- **Regulated (banking, insurance, pharma, aviation):** fixed regulatory dates (scope and resources flex); requirement-to-regulation-to-test traceability; audit trail and document control; sign-off by compliance, risk, legal, security (and actuarial in insurance); three lines of defense; controls testing, data privacy and residency, parallel runs; pharma: GxP, IQ/OQ/PQ validation, CAPA, trial phases I-IV.
- **Marketing and events:** fixed date, flexible scope; creative brief, campaign calendar, limited approval rounds; CPL, CAC, conversion, CTR, ROAS = revenue / ad spend; events: venue contract (attrition, F&B minimums), run of show, permits, contingencies, cost per attendee.
- **R&D and innovation:** TRL 1-9 as gate criteria; kill criteria; small bets as real options; ECV; learning milestones; ignore sunk cost.
- **Organizational change:** ADKAR or Kotter plus a project plan; impact assessment, champions network, training needs analysis, resistance plan; adoption rate = active users / target users.
- **Public sector:** procurement law, value for money, independent gateway reviews, audits, political stakeholders, citizen outcomes.
- **Programs, portfolios, megaprojects:** benefits maps and owners, interdependency management, portfolio scoring and balancing, capacity planning, stopping underperformers; megaprojects: reference class forecasting, modular design, plan slow and deliver fast.

## Laws and traps to name when you see them

Parkinson's law, student syndrome, Brooks' law, Hofstadter's law, planning fallacy and optimism bias, the 90-90 rule, Pareto 80/20, Conway's law, Goodhart's law, Little's law, Flyvbjerg's iron law of megaprojects, bikeshedding. Traps: scope creep, gold plating, sunk cost fallacy, watermelon reporting, hockey-stick plans, hero dependency, estimates turned into commitments, measuring activity instead of outcomes, agile theater, defending an outdated plan, silent escalation.

## Templates

**Charter (one page)**

```markdown
# <Project> charter
Sponsor: <name> | PM: <name> | Approved: <date>
## Purpose and business case (2-3 sentences, link the business case)
## Objectives and success criteria (SMART, with baseline and target)
## Scope: in / out
## Key deliverables and milestones (table: milestone, date, acceptance)
## Budget envelope and reserves
## Key stakeholders
## Top risks, assumptions, constraints, dependencies
## Governance: decision rights, tolerances, escalation path
## PM authority (staffing, spend, scope decisions)
```

**Risk register columns:** ID, risk statement (cause, event, effect), category, probability (1-5), impact (1-5), score, EMV, proximity, owner, response strategy, actions, trigger, contingency plan, residual score, status, last reviewed.

**RAID log columns:** type (risk / assumption / issue / dependency or decision), ID, description, impact, owner, due date, status, notes.

**Status report**

```markdown
# <Project> status, <date>: <RAG> (<trend>)
Forecast: finish <date> (baseline <date>), cost <EAC> vs BAC <BAC>
## Decisions needed (what, options, recommendation, by when, from whom)
## Progress since last report
## Next period
## Milestones (baseline vs. forecast)
## Top risks and issues (owner, action, date)
## EVM: CPI, SPI, SPI(t), TCPI
```

**Change request:** ID, requester, date, description, reason, impact on scope / schedule / cost / quality / risk / benefits, options, recommendation, decision, decided by, date, baselines updated (yes/no).

**Lessons learned entry:** situation, what happened, impact, root cause, recommendation, who should act, tags.

## pm_calc.py

When a calculation is needed, write this file to a scratch location (for example `/tmp/pm_calc.py`), run its self-test once with `python3 /tmp/pm_calc.py`, then import and call the functions. Standard library only.

```python
"""pm_calc.py - project management calculators (stdlib only)."""
from math import sqrt, log
from statistics import NormalDist

def npv(rate, initial, flows):
    """NPV of flows at t=1..n minus initial outlay at t=0."""
    return sum(cf / (1 + rate) ** t for t, cf in enumerate(flows, 1)) - initial

def irr(initial, flows, lo=-0.99, hi=10.0):
    for _ in range(200):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if npv(mid, initial, flows) > 0 else (lo, mid)
    return mid

def payback(initial, flows, rate=0.0):
    """Years to recover the outlay (discounted if rate > 0); None if never."""
    cum = -initial
    for t, cf in enumerate(flows, 1):
        d = cf / (1 + rate) ** t
        if cum + d >= 0:
            return t - 1 + (-cum) / d
        cum += d
    return None

def pert(o, m, p):
    """Returns (beta mean, triangular mean, sigma)."""
    return (o + 4 * m + p) / 6, (o + m + p) / 3, (p - o) / 6

def path_stats(tasks):
    """tasks = [(o, m, p), ...] in sequence -> (mean, sigma)."""
    stats = [pert(*t) for t in tasks]
    return sum(s[0] for s in stats), sqrt(sum(s[2] ** 2 for s in stats))

def prob_finish_by(target, mean, sigma):
    return NormalDist(mean, sigma).cdf(target)

def cpm(acts):
    """acts = {name: (duration, [predecessors])}, listed in dependency order.
    Day-0 convention. Returns (rows, project_duration, critical_names)."""
    es, ef = {}, {}
    for a, (d, preds) in acts.items():
        es[a] = max((ef[p] for p in preds), default=0)
        ef[a] = es[a] + d
    end = max(ef.values())
    succ = {a: [s for s, (_, ps) in acts.items() if a in ps] for a in acts}
    ls, lf = {}, {}
    for a in reversed(list(acts)):
        lf[a] = min((ls[s] for s in succ[a]), default=end)
        ls[a] = lf[a] - acts[a][0]
    rows = []
    for a in acts:
        ff = min((es[s] for s in succ[a]), default=end) - ef[a]
        rows.append(dict(act=a, dur=acts[a][0], es=es[a], ef=ef[a], ls=ls[a],
                         lf=lf[a], total_float=ls[a] - es[a], free_float=ff))
    return rows, end, [r["act"] for r in rows if r["total_float"] == 0]

def crash_slope(normal_cost, crash_cost, normal_time, crash_time):
    return (crash_cost - normal_cost) / (normal_time - crash_time)

def evm(bac, pv, ev, ac, planned_duration=None, earned_sched=None, actual_time=None):
    cpi, spi = ev / ac, ev / pv
    eac = bac / cpi
    out = dict(CV=ev - ac, SV=ev - pv, CPI=cpi, SPI=spi,
               EAC_typical=eac, EAC_atypical=ac + (bac - ev),
               EAC_cpi_spi=ac + (bac - ev) / (cpi * spi),
               ETC=eac - ac, VAC=bac - eac,
               TCPI_bac=(bac - ev) / (bac - ac), TCPI_eac=(bac - ev) / (eac - ac),
               pct_complete=ev / bac, pct_spent=ac / bac)
    if earned_sched is not None and actual_time:
        spit = earned_sched / actual_time
        out.update(SPI_t=spit, SV_t=earned_sched - actual_time)
        if planned_duration:
            out["IEAC_t"] = planned_duration / spit
    return out

def emv(risks):
    """risks = [(probability, impact)], threats negative -> total EMV."""
    return sum(p * i for p, i in risks)

def fpif(target_cost, target_fee, ceiling, seller_share, actual_cost):
    fee = target_fee + (target_cost - actual_cost) * seller_share
    price = min(actual_cost + fee, ceiling)
    pta = (ceiling - (target_cost + target_fee)) / (1 - seller_share) + target_cost
    return dict(fee=fee, price=price, seller_profit=price - actual_cost, PTA=pta)

def cpif(target_cost, target_fee, seller_share, actual_cost):
    fee = target_fee + (target_cost - actual_cost) * seller_share
    return dict(fee=fee, price=actual_cost + fee)

def channels(n):
    return n * (n - 1) // 2

def dpmo(defects, units, opportunities):
    d = defects / (units * opportunities) * 1e6
    return d, NormalDist().inv_cdf(1 - d / 1e6) + 1.5  # sigma with 1.5 shift

def cp_cpk(usl, lsl, mean, sigma):
    return (usl - lsl) / (6 * sigma), min(usl - mean, mean - lsl) / (3 * sigma)

def little_cycle_time(wip, throughput):
    return wip / throughput

def wsjf(cost_of_delay, job_size):
    return cost_of_delay / job_size

def rice(reach, impact, confidence, effort):
    return reach * impact * confidence / effort

def learning_curve(t1, n, rate):
    return t1 * n ** (log(rate) / log(2))

if __name__ == "__main__":  # self-test against known answers
    assert round(npv(0.10, 100000, [40000] * 3)) == -526
    assert round(irr(100000, [40000] * 3) * 100, 1) == 9.7
    assert payback(100000, [40000] * 3) == 2.5
    assert pert(4, 6, 14) == (7.0, 8.0, 10 / 6)
    rows, end, crit = cpm({"A": (3, []), "B": (4, ["A"]), "C": (6, ["A"]),
                           "D": (1, ["B"]), "E": (3, ["C", "D"]), "F": (2, ["E"])})
    assert end == 14 and crit == ["A", "C", "E", "F"]
    e = evm(100000, 60000, 50000, 55000, 10, 5, 6)
    assert round(e["EAC_typical"]) == 110000 and round(e["EAC_cpi_spi"]) == 121000
    assert round(e["TCPI_bac"], 2) == 1.11 and round(e["IEAC_t"]) == 12
    assert emv([(0.3, -40000), (0.1, -100000), (0.2, 25000)]) == -17000
    f = fpif(100000, 10000, 120000, 0.2, 115000)
    assert f["price"] == 120000 and f["PTA"] == 112500
    assert channels(12) - channels(8) == 38
    d, s = dpmo(17, 1000, 5)
    assert d == 3400 and round(s, 1) == 4.2
    assert tuple(round(x, 2) for x in cp_cpk(10.5, 9.5, 10.1, 0.1)) == (1.67, 1.33)
    assert little_cycle_time(12, 4) == 3 and rice(2000, 2, 0.8, 4) == 800
    assert round(learning_curve(100, 4, 0.9), 1) == 81.0
    print("all checks pass")
```