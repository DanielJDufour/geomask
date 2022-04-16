const lite = require("./lite.js");
const reprojectGeoJSON = require("reproject-geojson");

function calcMask({
  debug = false,
  fname,
  raster_bbox,
  raster_srs,
  raster_height,
  raster_width,
  pixel_height,
  pixel_width,
  mask,
  mask_srs
}) {
  if (raster_srs !== mask_srs) {
    mask = reprojectGeoJSON(mask, { from: mask_srs, to: raster_srs });
  }

  return lite[fname]({
    debug,
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    mask
  });
}

function inside(options) {
  return calcMask({ ...options, fname: "inside" });
}

function outside(options) {
  return calcMask({ ...options, fname: "outside" });
}

const geomask = { inside, outside };

if (typeof module === "object") module.exports = geomask;
