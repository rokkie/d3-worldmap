import {time} from 'd3';

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
 * Format a date to human readable form in UTC
 *
 * @param   {Date}    d Date to format
 * @returns {String}    Human readable format
 */
export let dateFormat = time.format.utc('%a, %b %d, %Y, %H:%M:%S UTC');

/**
 * Format elapsed time in human readable form
 *
 * @param   {Number}  start Start timestamp (milliseconds)
 * @param   {Number}  end   End timestamp (milliseconds)
 * @returns {String}        Elapsed time in human readable form
 */
export function elapsed (start, end) {
  let remainder      = end - start,
      millisInSecond = 1000,
      millisInMinute = millisInSecond * 60,
      millisInHour   = millisInMinute * 60,
      hours, minutes, seconds, millis;

  hours     = Math.floor(remainder / millisInHour);
  remainder = remainder % millisInHour;

  minutes   = Math.floor(remainder / millisInMinute);
  remainder = remainder % millisInMinute;

  seconds   = Math.floor(remainder / millisInSecond);
  millis    = remainder % millisInSecond;

  return `Operation took: ${millis} milliseconds, ${seconds} seconds, ${minutes} minutes, ${hours} hours`;
}

/**
 * Format number of bytes to human readable form
 *
 * e.g.:
 * 1024    -> 1 KiB
 * 1048576 -> 1 MiB
 *
 * @param   {Number}  bytes Number of bytes
 * @returns {String}        Human readable format
 */
export function humanFileSize (bytes) {
  let i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'][i];
}

/**
 * Format transfer speed in human readable form
 *
 * @param   {Number}  bytes     Number of bytes
 * @param   {Number}  duration  Duration in seconds
 * @returns {String}            Human readable format
 */
export function speed (bytes, duration) {
  let bps  = bytes / (duration / 1000),
      size = humanFileSize(bps);

  return `${size} / s`;
}

/**
 * Test if value is an object
 *
 * @param   {*}       val Value to test
 * @returns {Boolean}
 */
export function isObject(val) {
  return val instanceof Object && val.constructor === Object;
}

/**
 * Converts an object with key/values to a query string
 *
 * @param   {Object}  obj Object to create query string from
 * @returns {String}
 */
export function toQueryString(obj) {
  let q = Object.keys(obj).reduce((acc, cur) => {
    acc.push(encodeURIComponent(cur) + '=' + encodeURIComponent(obj[cur]));
    return acc;
  }, []).join('&');

  return (0 < q.length) ? '?' + q : '';
}
