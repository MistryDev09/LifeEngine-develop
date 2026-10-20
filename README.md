This is the readme for the changes made to the Life Engine evolution simulator. 

# The Life Engine Changes

# Azhar
- Added in 2 new Biomes: Forest and Desert: 
- Forest biome multiplies food spawn rate 2x, while Desert biome halves spawn rate of food produced by producer cells in each biome
- visually represented on the grid by green and brown cells. Neutral zone (in black) included as baseline.
- added in counters (in console) to track amount of food in each biome

# Devak
- New files (in src/Stats/)
- SpeciesTracker.js - stores the species, population history and parents and children. Also tracks individual species if chosen
- TrackingPanel.js - displays the species and population history in a chart. Also displays the family tree of the tracked species.
- OrganismPicture.js - draws the organism picture
- Charts/SpeciesPopulationChart.js - draws the population history chart with the legend being the pictures of the organisms

Added hooks in FossilRecod.js to update the species tracker and tracking panel when a new species is created or when a species goes extinct.
added hooks in StatsPanel.j to update the chart on new data and reset


# Jaylyn
- Added in 5 new cell types:
- <img width="70" height="72" alt="image" src="https://github.com/user-attachments/assets/6c50c2a5-59c4-4b86-9adf-bb1fbf1ecd00" /> - Predator cell: kills organisms with half the cells of its own size. Maximum of 12 cells for the kill.
- <img width="72" height="72" alt="image" src="https://github.com/user-attachments/assets/46bd8b50-9e07-4872-9a14-80923753f3f1" /> - Magnet cell: pulls loose food and mushrooms in a 2 cell radius with a 25% chance per tick. Originally it was radius of 3 at 100% - had to be nerfed.
- <img width="75" height="80" alt="image" src="https://github.com/user-attachments/assets/cb83ea50-82fe-4021-bada-0c92842b8298" /> - Hourglass cell: organisms live x2 longer but act every other tick.
- <img width="71" height="70" alt="image" src="https://github.com/user-attachments/assets/48145c0f-ef26-4f21-bf7f-f26a59b7c1ef" /> - Covid-19 cell: A disease that spreads every tick. Animals with 75%+ covid cells dies. ~1/2000 chance of mutation.
- <img width="71" height="75" alt="image" src="https://github.com/user-attachments/assets/43b70605-a412-496b-8f62-312644869c40" /> - Mushroom food: it contains x3 more food. 10% chance of food turning into a mushroom.

# Nathan
- Added heritable life-history genes: reproduction threshold, lifespan and offspring dispersal are now per-organism values instead of fixed constants
- Each gene is inherited by offspring and drifts by up to 3% at every birth, reusing the same path the engine already uses for mutation rate
- Reproduction threshold scales the food needed to reproduce, lifespan factor scales how long an organism lives, dispersal scales how far offspring are placed
- All three default to 1.0, which behaves exactly like the unmodified engine. No fitness cost is coded for any value, so any collapse is emergent
- Added a "Use evolved life history" toggle that pins every organism to fixed values, plus a gene drift rate setting, under Evolution Controls
- Added a Life History Genes chart and a live readout in the stats panel tracking the population mean of each gene
- Genes are saved and reloaded with the world, and recorded in the fossil record alongside population
- Files changed: src/Organism/Organism.js, src/Hyperparameters.js, src/Environments/WorldEnvironment.js, src/Stats/FossilRecord.js, src/Stats/StatsPanel.js, src/Controllers/ControlPanel.js, dist/index.html, src/Stats/Charts/LifeHistoryChart.js (new)
