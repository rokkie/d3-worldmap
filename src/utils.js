const TRIANGLE_SIZE = 5;

/**
 *
 * @param   {Number}  startPoint
 * @param   {Number}  endPoint
 * @returns {Number}
 */
export function angleBetweenPoints (startPoint, endPoint) {
  let angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  return angle * 180 / Math.PI;
}

/**
 *
 * @param   {Number}  p
 * @param   {Number}  a
 * @param   {Number}  d
 * @param   {Number}  triangleSize
 * @returns {string}
 */
export function pointOnCircle (p, a, d, triangleSize) {
  let newAngle = (a + d) * Math.PI / 180;
  return (p.x + Math.cos(newAngle) * triangleSize) + ',' + (p.y + Math.sin(newAngle) * triangleSize);
}

/**
 *
 * @param   {Object}  svg
 * @param   {Object}  path
 * @param   {Number}  triangleSize
 * @returns {String|Selection<Datum>|Update<Datum>}
 */
export function arrowOnLine (svg, path, triangleSize = TRIANGLE_SIZE) {
  let arrowSize   = triangleSize,
      totalLength = path.getTotalLength(),
      startPoint  = path.getPointAtLength(totalLength - arrowSize),
      endPoint    = path.getPointAtLength(totalLength),
      arrow       = svg.append('polygon'),
      angle       = angleBetweenPoints(startPoint, endPoint),
      p1          = pointOnCircle(endPoint, angle, 0, arrowSize),
      p2          = pointOnCircle(endPoint, angle, 135, arrowSize),
      p3          = pointOnCircle(endPoint, angle, -135, arrowSize);

  return arrow.attr('points', `${p1} ${p2} ${p3}`);
}
