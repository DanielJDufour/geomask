const test = require("flug");
const findAndRead = require("find-and-read");
const from = require("geotiff-from");
const getPreciseBoundingBox = require("geotiff-precise-bbox");
const proj4 = require("proj4");
const lite = require("./lite.js");
const full = require("./geomask.js");

const geojson = JSON.parse(findAndRead("sri-lanka.geojson", { encoding: "utf-8" }));

async function loadGeoTIFF(filename) {
  // same crs as geojson
  const arrayBuffer = await findAndRead(filename);
  const geotiff = await from(arrayBuffer);
  const image = await geotiff.getImage();
  const precise_bbox = getPreciseBoundingBox(image);
  const raster_bbox = precise_bbox.map(str => Number(str));
  const raster_height = image.getHeight();
  const raster_width = image.getWidth();

  const [resolutionX, resolutionY] = image.getResolution();
  const pixel_width = Math.abs(resolutionX);
  const pixel_height = Math.abs(resolutionY);

  return { raster_bbox, raster_height, raster_width, pixel_height, pixel_width };
}

(async function () {
  const tif3857 = await loadGeoTIFF("gadas-export-3857.tif");
  const tif4326 = await loadGeoTIFF("gadas-export-4326.tif");

  test("insides", ({ eq }) => {
    const { rows } = lite.inside({
      raster_bbox: tif4326.raster_bbox,
      raster_height: tif4326.raster_height,
      raster_width: tif4326.raster_width,
      pixel_height: tif4326.pixel_height,
      pixel_width: tif4326.pixel_width,
      mask: geojson
    });

    eq(rows.length, tif4326.raster_height);
    eq(rows.filter(Boolean).length, 176);
    eq(rows.filter(Boolean).slice(0, 5), [[[500, 501]], [[500, 503]], [[500, 504]], [[500, 505]], [[500, 506]]]);
  });

  test("insides (without pixel size)", ({ eq }) => {
    const { rows } = lite.inside({
      raster_bbox: tif4326.raster_bbox,
      raster_height: tif4326.raster_height,
      raster_width: tif4326.raster_width,
      mask: geojson
    });

    eq(rows.length, 472);
    eq(rows.filter(Boolean).length, 176);
    eq(rows.filter(Boolean).slice(0, 5), [[[500, 501]], [[500, 502]], [[500, 504]], [[499, 505]], [[499, 506]]]);
  });

  test("outsides", ({ eq }) => {
    const { rows } = lite.outside({
      raster_bbox: tif4326.raster_bbox,
      raster_height: tif4326.raster_height,
      raster_width: tif4326.raster_width,
      pixel_height: tif4326.pixel_height,
      pixel_width: tif4326.pixel_width,
      mask: geojson
    });

    eq(rows.length, 472);
    eq(rows.filter(Boolean).length, 472);
    eq(
      rows.every(segs => segs[0][0] === 0),
      true
    );
    eq(
      rows.every(segs => segs[segs.length - 1][1] === tif4326.raster_width - 1),
      true
    );
  });

  // different projection
  const reproject = proj4("EPSG:4326", "EPSG:3857").forward;

  test("insides reprojected geometry", ({ eq }) => {
    const { rows } = lite.inside({
      raster_bbox: tif3857.raster_bbox,
      raster_height: tif3857.raster_height,
      raster_width: tif3857.raster_width,
      pixel_height: tif3857.pixel_height,
      pixel_width: tif3857.pixel_width,
      mask: geojson,
      reproject
    });

    eq(rows.length, 475);
    eq(rows.filter(Boolean).length, 178);
    eq(rows.filter(Boolean).slice(0, 5), [[[500, 500]], [[499, 501]], [[499, 502]], [[499, 503]], [[498, 505]]]);
  });

  test("outsides reprojected geometry", ({ eq }) => {
    const { rows } = lite.outside({
      raster_bbox: tif3857.raster_bbox,
      raster_height: tif3857.raster_height,
      raster_width: tif3857.raster_width,
      pixel_height: tif3857.pixel_height,
      pixel_width: tif3857.pixel_width,
      mask: geojson,
      reproject
    });

    eq(rows.length, 475);
    eq(rows.filter(Boolean).length, 475);
    eq(
      rows.every(segs => segs[0][0] === 0),
      true
    );
    eq(
      rows.every(segs => segs[segs.length - 1][1] === tif3857.raster_width - 1),
      true
    );
  });

  // automatic reprojection
  test("insides with automatic reprojection", ({ eq }) => {
    const { rows } = full.inside({
      raster_bbox: tif3857.raster_bbox,
      raster_height: tif3857.raster_height,
      raster_width: tif3857.raster_width,
      raster_srs: 3857,
      pixel_height: tif3857.pixel_height,
      pixel_width: tif3857.pixel_width,
      mask: geojson,
      mask_srs: 4326
    });

    eq(rows.length, 475);
    eq(rows.filter(Boolean).length, 178);
    eq(rows.filter(Boolean).slice(0, 5), [[[500, 500]], [[499, 501]], [[499, 502]], [[499, 503]], [[498, 505]]]);
  });

  test("outsides with automatic reprojection", ({ eq }) => {
    const { rows } = full.outside({
      raster_bbox: tif3857.raster_bbox,
      raster_srs: 3857,
      raster_height: tif3857.raster_height,
      raster_width: tif3857.raster_width,
      pixel_height: tif3857.pixel_height,
      pixel_width: tif3857.pixel_width,
      mask: geojson,
      mask_srs: 4326
    });

    eq(rows.length, 475);
    eq(rows.filter(Boolean).length, 475);
    eq(
      rows.every(segs => segs[0][0] === 0),
      true
    );
    eq(
      rows.every(segs => segs[segs.length - 1][1] === tif3857.raster_width - 1),
      true
    );
  });

  ["sri-lanka.geojson", "sri-lanka-hires.geojson"].forEach(filename => {
    ["inside", "outside"].forEach(strategy => {
      test("no invalid ranges " + strategy + " " + filename, ({ eq }) => {
        const geojson = JSON.parse(findAndRead(filename, { encoding: "utf-8" }));
        const { rows } = full[strategy]({
          debug: true,
          raster_bbox: tif3857.raster_bbox,
          raster_srs: 3857,
          raster_height: tif3857.raster_height,
          raster_width: tif3857.raster_width,
          pixel_height: tif3857.pixel_height,
          pixel_width: tif3857.pixel_width,
          mask: geojson,
          mask_srs: 4326
        });
      });
    });
  });
})();
