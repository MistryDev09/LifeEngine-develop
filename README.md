This is the readme for the changes made to the Life Engine evolution simulator. 

# The Life Engine Changes

# Azhar
- Added in 2 new Biomes: Forest and Desert: 
- Forest biome multiplies food spawn rate 2x, while Desert biome halves spawn rate of food produced by producer cells in each biome
- visually represented on the grid by green and brown cells. Neutral zone (in black) included as baseline.
- added in counters (in console) to track amount of food in each biome

# Devak

# Jaylyn

# Nathan
- Added heritable life-history genes: reproduction threshold, lifespan and offspring dispersal are now per-organism values instead of fixed constants
- Each gene is inherited by offspring and drifts by up to 3% at every birth, reusing the same path the engine already uses for mutation rate
- Reproduction threshold scales the food needed to reproduce, lifespan factor scales how long an organism lives, dispersal scales how far offspring are placed
- All three default to 1.0, which behaves exactly like the unmodified engine. No fitness cost is coded for any value, so any collapse is emergent
- Added a "Use evolved life history" toggle that pins every organism to fixed values, plus a gene drift rate setting, under Evolution Controls
- Added a Life History Genes chart and a live readout in the stats panel tracking the population mean of each gene
- Genes are saved and reloaded with the world, and recorded in the fossil record alongside population
- Files changed: src/Organism/Organism.js, src/Hyperparameters.js, src/Environments/WorldEnvironment.js, src/Stats/FossilRecord.js, src/Stats/StatsPanel.js, src/Controllers/ControlPanel.js, dist/index.html, src/Stats/Charts/LifeHistoryChart.js (new)
