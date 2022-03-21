# geomask
Low-Level GeoSpatial Masking Functions

# features
- calculate raster pixels **inside** and **outside** a geometry mask
- built-in reprojection support for almost all projections (thanks to [proj4-fully-loaded](https://www.npmjs.com/package/proj4-fully-loaded))
- lite build for advanced usage 

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
rows is a multi-dimensional array where each row includes the ranges of pixels inside the mask
```js
[
  <92 empty items>, // the top 92 rows of the raster don't intersect the geometry mask
  [ [ 500, 500 ] ], // only 1 pixel in this row falls within the geometry mask
  [ [ 499, 501 ] ], // 3 pixels in this row fall within the mask, pixels with index 499, 500 and 501
  [ [ 499, 502 ] ], // 4 pixels from index 499 to 502 fall within the mask
  ... 380 more items
]
```
#### calculating exterior pixels
In order to calculate the pixels that are outside a masking geometry,
pass in the same parameters as above to the `geomask.outside` function
```js
import geomask from "geomask";

const { rows } = geomask.outside({ raster_bbox, raster_srs, raster_height, raster_width, mask, mask_srs: 4326 })
```
rows is a multi-dimensional array where each row includes the ranges of pixels outside the mask
```js
[
  [ [0, 967] ], // the top rows of the raster don't intersect the geometry mask
  [ [0, 967] ], // so the outside range extends the whole width of the raster
  [ [0, 967] ],
  <90 rows of [ [0, 967] ]>
  [ [ 0, 499 ], [501, 967] ], // all but one pixel (index 500) falls outside the mask
  ... 382 more items
]
```

### advanced usage
By default, geomask includes [proj4js-definitions](https://www.npmjs.com/package/proj4js-definitions), a large dataset of 
projection information for almost all standard projections.  This will add about 175kb to your bundle size.  If your mask 
is in the same projection as your raster or don't need built-in reprojection support, you can use `geomask/lite`.  You will use
a `reproject` function (instead of passing in raster_srs and mask_srs).
```js
import geomask from "geomask/lite";
import proj4 from "proj4";

geomask.inside({
  raster_bbox: [7698736.857788673, 163239.83797837654, 10066450.245949663, 1325082.6679127468 ],
  raster_height: 475,
  raster_width: 968,
  mask: { type: "FeatureCollection", features: [...] },

  // if your mask is in a different projection than your raster
  // provide a reproject function that converts an [x, y] point
  // from the geometry mask to a point in the raster projection
  reproject: proj4("EPSG:4326", "EPSG:3857").forward
})
```
