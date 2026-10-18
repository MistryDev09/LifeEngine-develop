const getFossilRecord = () => require("./FossilRecord");

const SpeciesTracker = {
    lineage: {}, // species id -> { id, name }
    history: {}, // species id -> list of [tick, population], for every species
    tracked: {}, // species id -> true

    reset() {
        this.lineage = {};
        this.history = {};
        this.tracked = {};
    },

    // called whenever a species enters the world.
    register(species, parent_species) {
        if (!species.id) {
            species.id = species.name;
        }
        if (!this.lineage[species.id]) {
            this.lineage[species.id] = { id: species.id, name: species.name };
        }
    },

    // called whenever a species is renamed.
    rename(species) {
        const entry = this.lineage[species.id];
        if (entry) {
            entry.name = species.name;
        }
    },

    isTracked(id) {
        return this.tracked[id] === true;
    },

    // takes one sample of every living species
    record() {
        const living_ids = {};
        for (const species of Object.values(getFossilRecord().extant_species)) {
            living_ids[species.id] = true;
            if (!this.history[species.id]) {
                this.history[species.id] = [];
            }
            this.addPoint(species.id, species.population);
        }

        for (const id in this.history) {
            if (living_ids[id]) {
                continue;
            }
            if (this.peak(id) < getFossilRecord().min_discard && !this.isTracked(id)) {
                delete this.history[id]; // died without ever being big: forget it
            } else if (this.latest(id) !== 0) {
                this.addPoint(id, 0); // died: the line drops to 0 once, then stops
            }
        }
    },

    // adds one [tick, population] point to a species' history
    addPoint(id, population) {
        const fossil_record = getFossilRecord();
        const points = this.history[id];
        points.push([fossil_record.env.total_ticks, population]);
        if (points.length > fossil_record.record_size_limit) {
            points.shift();
        }
    },

    // the population at the last sample
    latest(id) {
        const points = this.history[id];
        return points[points.length - 1][1];
    },

    // the highest population in the history
    peak(id) {
        let highest = 0;
        for (const point of this.history[id]) {
            highest = Math.max(highest, point[1]);
        }
        return highest;
    },

    // which species the chart and the panel show. Top 5
    visibleIds() {
        const alive = [];
        for (const id in this.history) {
            if (this.latest(id) > 0) {
                alive.push(id);
            }
        }
        alive.sort((a, b) => this.latest(b) - this.latest(a));
        return alive.slice(0, 5);
    },

    // the same colour every time for the same species, used for the chart line
    color(id) {
        let hue = 0;
        for (const letter of id) {
            hue = (hue * 31 + letter.charCodeAt(0)) % 360;
        }
        return "hsl(" + hue + ", 70%, 45%)";
    },
};

module.exports = SpeciesTracker;
