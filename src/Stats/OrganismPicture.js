const CELL_PIXELS = 6; // size of one body cell in a picture

const OrganismPicture = {
    // draws an anatomy on a canvas, centred on the organism's first cell
    draw(anatomy) {
        const cells = anatomy ? anatomy.cells : [];
        let radius = 0;
        for (const cell of cells) {
            radius = Math.max(radius, Math.abs(cell.loc_col), Math.abs(cell.loc_row));
        }

        const canvas = document.createElement('canvas');
        canvas.width = (2 * radius + 1) * CELL_PIXELS;
        canvas.height = canvas.width;
        const ctx = canvas.getContext('2d');
        for (const cell of cells) {
            ctx.fillStyle = cell.state.color;
            ctx.fillRect((cell.loc_col + radius) * CELL_PIXELS, (cell.loc_row + radius) * CELL_PIXELS,
                         CELL_PIXELS, CELL_PIXELS);
        }
        return canvas;
    },
};

module.exports = OrganismPicture;
