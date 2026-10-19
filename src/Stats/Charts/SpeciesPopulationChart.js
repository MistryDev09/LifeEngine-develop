const SpeciesTracker = require("../SpeciesTracker");
const ChartController = require("./ChartController");
const OrganismPicture = require("../OrganismPicture");

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
                showInLegend: false, // the legend is drawn by drawLegend()
                name: id,
                dataPoints: data_points
            });
        }
    }

    // rebuild the whole chart each time instead of adding points
    updateData() {
        this.setData();
    }

    // the base class draws the chart, then the legend is drawn under it
    render() {
        super.render();
        this.drawLegend();
    }

    // one item per species: a colour dot and a picture of the body
    drawLegend() {
        const legend = $('#species-legend').empty();
        for (const id of SpeciesTracker.visibleIds()) {
            const entry = SpeciesTracker.lineage[id];
            const item = $('<span class="legend-item">').attr('title', entry.name); // the name shows on hover
            item.append($('<span class="swatch">').css('background', SpeciesTracker.color(id)));
            item.append(OrganismPicture.draw(entry.anatomy));
            legend.append(item);
        }
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
