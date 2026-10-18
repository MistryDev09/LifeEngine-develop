// The Tracked Species panel in the Statistics tab: buttons, and a list of the tracked species.
const FossilRecord = require("./FossilRecord");
const SpeciesTracker = require("./SpeciesTracker");

const TrackingPanel = {
    // onChange is called after every button press, so the list and chart refresh even while the sim is paused
    init(onChange) {
        this.onChange = onChange;

        $('#track-add').click(() => {
            const name = $('#track-search').val().trim();
            const species = Object.values(FossilRecord.extant_species).find(s => s.name === name);
            if (species) {
                SpeciesTracker.track(species.id);
            }
            this.onChange();
        });
        $('#track-top').click(() => {
            SpeciesTracker.trackTop(5);
            this.onChange();
        });
        $('#track-clear').click(() => {
            SpeciesTracker.untrackAll();
            this.onChange();
        });
    },

    // redraws the list of tracked species
    render() {
        const list = $('<ul>');
        for (const id in SpeciesTracker.tracked) {
            list.append(this.makeRow(id));
        }
        $('#species-tree').empty().append(list);
    },

    // one tracked species: swatch, name and population, remove button
    makeRow(id) {
        const species = SpeciesTracker.lineage[id];
        const row = $('<li>');
        row.append($('<span class="swatch">').css('background', SpeciesTracker.color(id)));

        let status;
        if (species.extinct) {
            status = 'extinct';
        } else {
            status = species.population;
        }
        row.append($('<span>').text(species.name + ' (' + status + ')'));

        const remove = $('<button>').text('✕');
        remove.click(() => {
            SpeciesTracker.untrack(id);
            this.onChange();
        });
        row.append(remove);
        return row;
    },
};

module.exports = TrackingPanel;
