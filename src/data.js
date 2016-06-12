import d3 from 'd3';
import {isObject, toQueryString} from './utils';

const URL_MAPDATA        = '/data/world-map.json';
const URL_TRANSFERS      = 'http://localhost:9090/transfers';
const ERR_MALFORMED_DATA = 'Data is malformed. Expected array, got';

export default class Data {
  /**
   *
   * @returns {Promise}
   */
  static fetchMap () {
    return new Promise((resolve, reject) => {
      d3.json(URL_MAPDATA, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
      });
    });
  }

  /**
   *
   * @param   {Object}  [filters]
   * @returns {Promise}
   */
  static fetchTraffic (filters = null) {
    let qs = isObject(filters) ? toQueryString(filters) : '';

    return new Promise((resolve, reject) => {
      d3.json(URL_TRANSFERS + qs, (err, data) => {
        if (err) { reject(err); }

        if (isObject(data) &&
          -1 !== Object.keys(data).indexOf('displayName') &&
          -1 !== Object.keys(data).indexOf('message')) {
          reject(data.message);
        }

        if (!Array.isArray(data)) {
          let actual = typeof data,
              e      = new TypeError(`${ERR_MALFORMED_DATA} ${actual}`);
          reject(e);
        }

        resolve(data);
      });
    });
  }
}
