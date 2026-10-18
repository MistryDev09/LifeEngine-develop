const SpeciesTracker = require("../SpeciesTracker");
const ChartController = require("./ChartController");

class SpeciesPopulationChart extends ChartController {
    constructor() {
        super("Species Populations", "Organisms", "The 5 most populous species.");
    }

    // one line per species in the history
    setData() {
        this.data.length = 0;
        // show the top 5 ids
        for (const id of SpeciesTracker.visibleIds()) {
            const data_points = [];
            // a species can have no history yet (it was born after the last sample)
            const points = SpeciesTracker.history[id] || [];
            for (const point of points) {
                data_points.push({ x: point[0], y: point[1] });
            }
            this.data.push({
                type: "line",
                markerType: "none",
                color: SpeciesTracker.color(id),
                showInLegend: true,
                name: id,
                legendText: SpeciesTracker.lineage[id].name,
                dataPoints: data_points
            });
        }
    }

    // rebuild the whole chart each time instead of adding points
    updateData() {
        this.setData();
    }

    // assume 1 line
    setMinimum() {
        let min = null;
        for (const series of this.data) {
            if (series.dataPoints.length === 0) {
                continue;
            }
            const first = series.dataPoints[0].x;
            if (min === null || first < min) {
                min = first;
            }
        }
        this.chart.options.axisX.minimum = (min === null) ? 0 : min;
    }
}

module.exports = SpeciesPopulationChart;
