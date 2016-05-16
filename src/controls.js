import d3 from 'd3';
import * as worldmap from './worldmap';
import * as utils from './utils';

const TICK_INTERVAL = 20;
const TICK_STEP     = 100;
const STATE_PLAYING = 'playing';
const STATE_PAUSED  = 'paused';

var interval, state;

/**
 *
 * @param {d3.selection}  container
 */
function tick (container) {
  let el  = container.select('.track'),
      val = parseInt(el.attr('value'), 10),
      max = parseInt(el.attr('max'), 10),
      newVal;

  if (max <= val) {
    clearInterval(interval);
    pause();
  } else {
    newVal = val + TICK_STEP;
    el.attr('value', (max > newVal) ? newVal : max);
  }

  el.node().dispatchEvent(new Event('change', {
    bubbles   : true,
    cancelable: false
  }));
}

/**
 *
 * @param   {d3.selection}  container
 * @param   {Array}         data
 * @returns {Function}
 */
function onChange (container, data) {
  let maxBytes = d3.max(data, (d) => { return parseInt(d.nbytes_size, 10); }),
      scaleFn  = d3.scale.linear().domain([0, maxBytes]).range(['green', 'red']);

  return function () {
    let timestamp = parseInt(d3.event.target.value, 10),
        updata;

    // update view with new date/time
    container.select('span.datetime').text(utils.dateFormat(new Date(timestamp)));

    // filter the dataset based on the datetime
    updata = data.filter((d) => {
      return (
        timestamp >= Date.parse(d.start_timestamp) &&
        timestamp <= Date.parse(d.end_timestamp)
      );
    });

    // update map with new data
    worldmap.update(updata, scaleFn);
  };
}

/**
 *
 */
function pause () {
  clearInterval(interval);
  state = STATE_PAUSED;
}

/**
 *
 * @param {d3.selection}  container
 */
function play (container) {
  if (STATE_PLAYING === state) { return; }

  interval = setInterval(tick.bind(undefined, container), TICK_INTERVAL);
  state    = STATE_PLAYING;
}

/**
 *
 * @param {d3.selection}  container
 * @param {Array}         data
 * @param {Boolean}       autoplay  [optional] Default to true
 */
export function init (container, data, autoplay = true) {
  let minDate = d3.min(data, (d) => { return Date.parse(d.start_timestamp); }),
      maxDate = d3.max(data, (d) => { return Date.parse(d.end_timestamp); }),
      controls;

  // create a range input for the track
  controls = container
    .append('div')
    .classed('controls', true);

  controls
    .append('input')
    .attr('type', 'range')
    .attr('min', minDate)
    .attr('max', maxDate)
    .attr('value', minDate)
    .classed('track', true)
    .on('change', onChange(container, data));

  // span to container current date/time
  controls
    .append('span')
    .classed('datetime', true);

  // set initial state
  state = STATE_PAUSED;

  // autoplay
  if (autoplay) { play(controls); }
}
