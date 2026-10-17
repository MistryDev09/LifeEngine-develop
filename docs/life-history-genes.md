# Heritable Life-History Genes

Author: Nathan Delfava — Group 15, Conspicuous Chameleons

## What this adds

In the base engine an organism's reproduction threshold, lifespan and offspring
dispersal are fixed functions of body size and of global constants, so the only
thing that can evolve is anatomy. This change makes three of them per-organism
scalars that are inherited by offspring and drift slightly at every birth, using
the same inheritance path the engine already uses for `mutability`.

| Gene | Replaces | Default | Bounds |
|---|---|---|---|
| `repro_threshold` | the implicit `1.0` in `foodNeeded()` | 1.0 | 0.3 – 3.0 |
| `lifespan_factor` | global-only `lifespanMultiplier` | 1.0 | 0.3 – 3.0 |
| `dispersal` | the hard-coded offspring offset range in `reproduce()` | 1.0 | 0.5 – 4.0 |

At the default value of 1.0 every gene reproduces the base engine's behaviour
exactly, so a run with the genes pinned at 1.0 is the unmodified simulation.

## Why, for the evolutionary-suicide question

No fitness cost is coded anywhere. Lowering `repro_threshold` is always
individually advantageous: the organism reproduces sooner, on less food, every
time. The only penalty is ecological, and it comes from mechanisms that were
already in the engine:

* food can only be produced into an empty adjacent tile, so bodies occupying
  space suppress food production;
* `foodBlocksReproduction` means food itself blocks births;
* `reproduce()` deducts the food cost whether or not the birth found room, so a
  parent in a saturated neighbourhood pays for offspring it never places.

A lineage that breeds cheaper therefore saturates its own neighbourhood and
starves. That is a candidate for mis-adaptation rather than failure to adapt,
and nothing in the code refers to extinction, population size, or death rates,
so any collapse is emergent.

The genes are continuous, which is what makes the claim measurable: the
population mean of each gene is recorded on the same tick axis as population
size, so mis-adaptation appears as a gene still moving while the population
peaks and turns over.

## Files changed

| File | Change |
|---|---|
| `src/Organism/Organism.js` | gene fields, inheritance, per-birth drift, `foodNeeded()`, `lifespan()`, dispersal in `reproduce()` |
| `src/Hyperparameters.js` | `useGlobalLifeHistory`, `lifeHistoryStep`, `globalReproThreshold`, `globalLifespanFactor`, `globalDispersal` |
| `src/Environments/WorldEnvironment.js` | running totals and `averageLifeHistory()` |
| `src/Stats/FossilRecord.js` | three new recorded series, included in save files |
| `src/Stats/Charts/LifeHistoryChart.js` | new chart (added) |
| `src/Stats/StatsPanel.js` | registers the chart, adds the stats-panel readout |
| `src/Controllers/ControlPanel.js`, `dist/index.html` | controls under "Life History Genes" |
| `tools/headless_runner.js` | batch runner for replicate trials (added) |

Organism save files pick the genes up automatically, because
`SerializeHelper.copyNonObjects` copies every scalar field on an organism.

## Controls

Under **Evolution Controls → Life History Genes**:

* **Use evolved life history** — on by default. Turn it off to pin every
  organism to the fixed values below; this is how control runs are made.
* **Gene drift per birth (%)** — how far a gene may move at each birth, as a
  percentage of its current value. Default 3. Larger values reach the bounds in
  a few hundred ticks, which hides the trait trajectory; keep it small.
* **Fixed reproduction threshold / lifespan factor / dispersal range** — used
  when evolved life history is off. Setting these to values observed at the end
  of an evolving run is the re-invasion test described below.

The **Life History Genes** chart plots all three population means. Read it
beside the Population chart.

## Experiment protocol

1. **Evolving arm.** Run replicate trials with the genes evolving. Record the
   gene means and population over time.
2. **Pinned control.** Same seeds, same seeded species, genes pinned at 1.0. If
   the two arms differ in extinction rate, the genes are responsible.
3. **Re-invasion test.** Take the gene values reached by the dominant lineage in
   an evolving run and pin a fresh world to those values, with the same anatomy
   as the ancestor. If the evolved values go extinct where the ancestral values
   persist, the population evolved itself into non-viability. This is the
   strongest available evidence, because anatomy and environment are held
   constant and only the evolved trait differs.

Single trials are not informative — outcomes vary a lot between seeds. Use the
batch runner.

## Batch runner

```
node tools/headless_runner.js --trials 20 --ticks 36000 --out data/evolving.csv
node tools/headless_runner.js --trials 20 --ticks 36000 --pinned --out data/control.csv
node tools/headless_runner.js --trials 20 --ticks 36000 --pinned --repro 0.36 --lifespan 0.52 --out data/reinvasion.csv
```

Each trial uses `--seed + trial_index` as its RNG seed, so a condition can be
re-run exactly. The runner reports how many trials ended in extinction, the
tick at which each one died, peak population and the final gene means, and
writes a per-sample CSV for plotting.

Custom seed species can be supplied with `--species file.json`:

```json
[
  {"count": 1, "cells": [["mouth", 0, 0], ["mover", 1, 0], ["eye", -1, 0]]},
  {"count": 6, "cells": [["producer", 0, 0], ["producer", 1, 1]]}
]
```

Cell names are those in `src/Organism/Cell/CellStates.js`. Coordinates are
relative to the organism's centre, which must include a cell at `0,0`.

Note that the runner does not restart the world on extinction, unlike the
in-page simulation, so extinction events cannot be missed.
