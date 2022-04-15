const dufour_peyton_intersection = require("dufour-peyton-intersection");
const subtract = require("preciso/subtract.js");
const divide = require("preciso/divide.js");
const reprojectGeoJSON = require("reproject-geojson/pluggable.js");
const segflip = require("segflip");

function inside({ raster_bbox, raster_height, raster_width, pixel_height, pixel_width, mask, reproject }) {
  if (typeof reproject === "function") {
    // reproject geometry to the srs of the raster
    mask = reprojectGeoJSON(mask, { in_place: false, reproject });
  }

  if (pixel_height === undefined)
    pixel_height = Number(
      divide(subtract(raster_bbox[3].toString(), raster_bbox[1].toString()), raster_height.toString())
    );
  if (pixel_width === undefined)
    pixel_width = Number(
      divide(subtract(raster_bbox[2].toString(), raster_bbox[0].toString()), raster_width.toString())
    );

  const insides = new Array(raster_height);

  // calculate pixels inside the geometry
  dufour_peyton_intersection.calculate({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    geometry: mask,
    per_row_segment: ({ row, columns }) => {
      if (!insides[row]) insides[row] = [];
      insides[row].push(columns);
    }
  });

  return { rows: insides };
}

function outside({ raster_bbox, raster_height, raster_width, pixel_height, pixel_width, mask, reproject }) {
  if (typeof reproject === "function") {
    // reproject geometry to the srs of the raster
    mask = reprojectGeoJSON(mask, { in_place: false, reproject });
  }

  if (pixel_height === undefined)
    pixel_height = Number(
      divide(subtract(raster_bbox[3].toString(), raster_bbox[1].toString()), raster_height.toString())
    );
  if (pixel_width === undefined)
    pixel_width = Number(
      divide(subtract(raster_bbox[2].toString(), raster_bbox[0].toString()), raster_width.toString())
    );

  // calculate inside segments
  const { rows: insides } = inside({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    mask
  });

  const last_column_index = raster_width - 1;

  // consider optimizing memory and speed
  // by just returning a reference to a whole row
  // instead of generating a new array every time
  // const whole_row = [0, last_column_index];

  const outsides = [];
  // using for loop instead of map because
  // map skips empty insides/rows
  for (let i = 0; i < insides.length; i++) {
    const segs = insides[i];
    if (!Array.isArray(segs) || segs.length === 0) {
      outsides.push([[0, last_column_index]]);
    } else {
      outsides.push(
        segflip({
          segments: segs,
          min: 0,
          max: last_column_index,
          debug: false
        })
      );
    }
  }

  return { rows: outsides };
}

const geomask = { inside, outside };

if (typeof module === "object") module.exports = geomask;
