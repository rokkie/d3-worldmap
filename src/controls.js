import d3 from 'd3';
import * as worldmap from './worldmap';
import * as utils from './utils';

const TICK_INTERVAL = 20;
const TICK_STEP     = 100;
const STATE_PLAYING = 'playing';
const STATE_PAUSED  = 'paused';
const MODE_LOOPING  = 'looping';
const MODE_ENDING   = 'ending';
const SCALE_MIN     = '#00ff00';
const SCALE_MID     = '#0000ff';
const SCALE_MAX     = '#ff0000';

let ct, scaleFn, interval, state, mode;

/**
 * Tick function for playback
 *
 * Adds TICK_STEP milliseconds to actual time and updates track with new value.
 * Pauses playback if end of track is reached, unless looping is on in which
 * case it will start at the beginning of the track.
 * Dispatches event to notify value change.
 */
function tick () {
  let el  = ct.select('input[type="range"]'),
      val = parseInt(el.property('value'), 10),
      max = parseInt(el.property('max'), 10),
      min, newVal;

  // if the maximum is lower than the current value
  if (max <= val) {
    // and we're in looping mode
    if (MODE_LOOPING === mode) {
      // set the value to the minimum
      min = parseInt(el.property('min'), 10);
      el.property('value', min);
    } else {
      // otherwise pause playback
      pause();
    }
  } else {
    // otherwise ass TICK_STEP to the current value
    newVal = val + TICK_STEP;

    // set the new value to be the lowest of the newly calculated or the maximum
    el.property('value', d3.min([newVal, max]));
  }

  // dispatch an event to notify the change of value
  el.node().dispatchEvent(new Event('change', {
    bubbles   : true,
    cancelable: false
  }));
}

/**
 * Function factory for change callback
 *
 * Creates a function to be used as a callback for the change event.
 * Returned function updates track with actual time and updates map
 * with filtered domain data based on the actual time.
 *
 * @param   {Array}     data  Domain data
 * @returns {Function}        Callback for change event
 */
function onChange (data) {
  let datetime = ct.select('span.datetime');

  return function () {
    let timestamp = parseInt(d3.event.target.value, 10),
        updata;

    // update view with new date/time
    datetime.text(utils.dateFormat(new Date(timestamp)));

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
 * Pause playback
 */
function pause () {
  clearInterval(interval);
  state = STATE_PAUSED;

  ct.select('.playpause')
    .classed('icon-play3', true)
    .classed('icon-pause2', false);
}

/**
 * Start playback
 */
function play () {
  if (STATE_PLAYING === state) { return; }

  interval = setInterval(tick, TICK_INTERVAL);
  state    = STATE_PLAYING;

  ct.select('.playpause')
    .classed('icon-play3', false)
    .classed('icon-pause2', true);
}

/**
 * Plays or pauses playback based on current state
 */
function playpause () {
  ((STATE_PLAYING === state) ? pause : play)();
}

/**
 * Toggle looping of playback
 */
function loop () {
  mode = (MODE_LOOPING === mode) ? MODE_ENDING : MODE_LOOPING;

  ct.select('.looptoggle')
    .classed('active', (MODE_LOOPING === mode));
}

/**
 * Initialize the controls
 *
 * Draws player controls in the specified container.
 * Should be called before anything else.
 *
 * @param {d3.selection}  container Element to put the controls in
 * @param {Array}         data      Domain data
 * @param {Boolean}       autoplay  [optional] Default to true
 */
export function init (container, data, autoplay = true) {
  let minDate  = d3.min(data, (d) => { return Date.parse(d.start_timestamp); }),
      maxDate  = d3.max(data, (d) => { return Date.parse(d.end_timestamp); }),
      maxBytes = d3.max(data, (d) => { return parseInt(d.nbytes_size, 10); }),
      controls, legend;

  // store reference to container
  ct = container;

  // create scale function
  scaleFn = d3.scale.linear().domain([0, maxBytes]).range([SCALE_MIN, SCALE_MID, SCALE_MAX]);

  // append container
  controls = container
    .append('div')
    .classed('controls', true);

  // append play button
  controls
    .append('span')
    .classed('btn playpause icon-play3', true)
    .on('click', playpause);

  // append loop button
  controls
    .append('span')
    .classed('btn looptoggle icon-loop2', true)
    .on('click', loop);

  // append container for date/time
  controls
    .append('span')
    .classed('datetime', true);

  // append track
  controls
    .insert('input', ':last-child')
    .attr('type', 'range')
    .attr('min', minDate)
    .attr('max', maxDate)
    .attr('value', minDate)
    .on('change', onChange(data));

  // legend
  legend = container
    .append('div')
    .classed('legend', true);

  legend
    .append('div')
    .text(utils.humanFileSize(maxBytes));

  legend
    .append('div')
    .classed('scale', true);

  legend
    .append('div')
    .text('0 B');

  // set initial state and mode
  state = STATE_PAUSED;
  mode  = MODE_ENDING;

  // autoplay
  if (autoplay) { play(); }
}
