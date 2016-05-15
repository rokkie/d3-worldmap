
var Utils = {

  triangleSize: 5,

  angleBetweenPoints: function (startPoint, endPoint) {
    var angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    return angle * 180 / Math.PI;
  },

  pointOnCircle: function(p, a, d, triangleSize) {
    var newAngle = (a + d) * Math.PI / 180;
    return (p.x + Math.cos(newAngle) * triangleSize) + ',' + (p.y + Math.sin(newAngle) * triangleSize);
  },

  arrowOnLine: function (svg, path, triangleSize) {
    var arrowSize   = triangleSize || Utils.triangleSize,
        totalLength = path.getTotalLength(),
        startPoint  = path.getPointAtLength(totalLength - arrowSize),
        endPoint    = path.getPointAtLength(totalLength),
        arrow       = svg.append('polygon'),
        angle       = Utils.angleBetweenPoints(startPoint, endPoint),
        p1          = Utils.pointOnCircle(endPoint, angle, 0, arrowSize),
        p2          = Utils.pointOnCircle(endPoint, angle, 135, arrowSize),
        p3          = Utils.pointOnCircle(endPoint, angle, -135, arrowSize);

    return arrow.attr('points', `${p1} ${p2} ${p3}`);
  }
};
