# geomask
Low-Level GeoSpatial Masking Functions

# install
```bash
npm install geomask
```

### usage
#### calculating interior pixels
In order to calculate the pixels that are inside a masking geometry:
```js
import geomask from "geomask";

// calculate the horizontal segments of pixels
// that fall within the masking geometry
const { rows } = geomask.inside({
  // bounding box in projection of the raster
  // in this case, Web Mercator
  raster_bbox: [
    7698736.857788673, // xmin
    163239.83797837654, // ymin
    10066450.245949663, // xmax
    1325082.6679127468 // ymax
  ],

  // spatial reference system of the raster
  // 3857 is the EPSG code for Web Mercator
  raster_srs: 3857,

  // height of the raster
  raster_height: 475,

  // width of the raster
  raster_width: 968,

  // optional height of pixel in srs units
  pixel_height: 2445.98490512499,

  // optional width of pixel in srs units
  pixel_width: 2445.9849051249894,

  // a masking geometry in GeoJSON format
  // currently, only Polygon and MultiPolygon geometries are supported
  // in the example below, we see a GeoJSON Feature Collection of Polygon Features
  mask: { type: "FeatureCollection", features: [...] },

  // the standard projection used by GeoJSON
  mask_srs: 4326
});
```
