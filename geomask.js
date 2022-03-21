const lite = require("./lite.js");
const reprojectGeoJSON = require("reproject-geojson");

function inside({ raster_bbox, raster_srs, raster_height, raster_width, pixel_height, pixel_width, mask, mask_srs }) {
  if (raster_srs !== mask_srs) {
    mask = reprojectGeoJSON(mask, { from: mask_srs, to: raster_srs });
  }
  return lite.inside({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    mask
  });
}

function outside({ raster_bbox, raster_srs, raster_height, raster_width, pixel_height, pixel_width, mask, mask_srs }) {
  if (raster_srs !== mask_srs) {
    mask = reprojectGeoJSON(mask, { from: mask_srs, to: raster_srs });
  }
  return lite.outside({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    mask
  });
}

const geomask = { inside, outside };

if (typeof module === "object") module.exports = geomask;
