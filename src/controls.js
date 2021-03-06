import d3 from 'd3';
import Pikaday from 'pikaday';
import Worldmap from './worldmap';
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
const DATE_FORMAT   = 'DD-MM-YYYY';
const DATE_PATTERN  = '\d{2}-\d{2}-\d{4}';

export default class Controls {

  /**
   * Constructor
   *
   * @param {d3.selection}  container Where to put the controls in
   * @param {Worldmap}      map       The map to control
   * @param {Array}         [data]    Domain data
   */
  constructor (container, map, data = null) {
    // private
    this._ct            = container;
    this._map           = undefined;
    this._data          = undefined;
    this._scaleFn       = undefined;
    this._controls      = undefined;
    this._filters       = undefined;
    this._legend        = undefined;
    this._dateInPicker  = undefined;
    this._dateOutPicker = undefined;
    this._interval      = undefined;
    this._state         = STATE_PAUSED;
    this._mode          = MODE_ENDING;

    // set map
    this.map = map;

    // append container
    this._controls = this.container
      .append('div')
      .classed('controls', true);

    // append play button
    this.controls
      .append('span')
      .classed('btn playpause icon-play3', true)
      .on('click', this.playpause.bind(this));

    // append loop button
    this.controls
      .append('span')
      .classed('btn looptoggle icon-loop2', true)
      .on('click', this.loop.bind(this));

    // append container for date/time
    this.controls
      .append('span')
      .classed('datetime', true);

    // append track
    this.controls
      .insert('input', ':last-child')
      .attr('type', 'range');

    this._filters = this.container
      .append('div')
      .classed('filters', true);

    this.filters
      .append('label')
      .attr('for', 'date-in')
      .text('Start Date');

    this._dateInField = this.filters
      .append('input')
      .classed('date', true)
      .attr('id', 'date-in')
      .attr('name', 'date-out')
      .attr('type', 'text')
      .attr('pattern', DATE_PATTERN)
      .node();

    this.filters
      .append('label')
      .attr('for', 'date-end')
      .text('End Date');

    this._dateOutField = this.filters
      .append('input')
      .classed('date', true)
      .attr('id', 'date-out')
      .attr('name', 'date-out')
      .attr('type', 'text')
      .attr('pattern', DATE_PATTERN)
      .node();

    // legend
    this._legend = this.container
      .append('div')
      .classed('legend', true);

    this.legend
      .append('div');

    this.legend
      .append('div')
      .classed('scale', true);

    this.legend
      .append('div')
      .text('0 B');

    if (null !== data) {
      this.data = data;
    }
  }


  /**
   * Tick function for playback
   *
   * Adds TICK_STEP milliseconds to actual time and updates track with new value.
   * Pauses playback if end of track is reached, unless looping is on in which
   * case it will start at the beginning of the track.
   * Dispatches event to notify value change.
   */
  tick () {
    let el  = this.container.select('input[type="range"]'),
        val = parseInt(el.property('value'), 10),
        max = parseInt(el.property('max'), 10),
        min, newVal;

    // if the maximum is lower than the current value
    if (max <= val) {
      // and we're in looping mode
      if (MODE_LOOPING === this.mode) {
        // set the value to the minimum
        min = parseInt(el.property('min'), 10);
        el.property('value', min);
      } else {
        // otherwise pause playback
        this.pause();
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
  onChange (data) {
    let datetime = this.container.select('span.datetime'),
        scaleFn  = this.scaleFn,
        worldmap = this.map;

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
   * Relays change-event of date picker
   *
   * Makes it so we can listen explicitly for 'datechange'.
   * Also, if we just listen for 'change' on e.g. the controls,
   * the event target end up being 'document' with no event details
   * which makes it near useless for our purpose.
   *
   * @listens {Event}       change
   * @emits   {CustomEvent} datechange
   */
  onDateSelect () {
    this.controls.node().dispatchEvent(new CustomEvent('datechange', {
      bubbles   : true,
      cancelable: false,
      detail    : {
        dateIn : this.dateInPicker.getDate(),
        dateOut: this.dateOutPicker.getDate()
      }
    }));
  }

  /**
   * Pause playback
   */
  pause () {
    clearInterval(this.interval);
    this._state = STATE_PAUSED;

    this.container.select('.playpause')
      .classed('icon-play3', true)
      .classed('icon-pause2', false);
  }

  /**
   * Start playback
   */
  play () {
    if (STATE_PLAYING === this.state) { return; }

    this._interval = setInterval(this.tick.bind(this), TICK_INTERVAL);
    this._state    = STATE_PLAYING;

    this.container.select('.playpause')
      .classed('icon-play3', false)
      .classed('icon-pause2', true);
  }

  /**
   * Plays or pauses playback based on current state
   */
  playpause () {
    ((STATE_PLAYING === this._state) ? this.pause.bind(this) : this.play.bind(this))();
  }

  /**
   * Toggle looping of playback
   */
  loop () {
    this._mode = (MODE_LOOPING === this.mode) ? MODE_ENDING : MODE_LOOPING;

    this.container.select('.looptoggle')
      .classed('active', (MODE_LOOPING === this.mode));
  }

  /**
   * Get the container
   *
   * @returns {d3.selection}
   */
  get container () {
    return this._ct;
  }

  /**
   * Get the map
   *
   * @returns {Worldmap}
   */
  get map () {
    return this._map;
  }

  /**
   * Set the map
   *
   * @param {Worldmap}  map
   */
  set map (map) {
    if (!map instanceof Worldmap) {
      throw new TypeError('Incorrect parameter type');
    }

    this._map = map;
  }

  /**
   * Get data
   *
   * @returns {Array}
   */
  get data () {
    return this._data;
  }

  /**
   * Set data
   *
   * @param {Array} data
   */
  set data (data) {
    let minDate  = d3.min(data, (d) => { return Date.parse(d.start_timestamp); }),
        maxDate  = d3.max(data, (d) => { return Date.parse(d.end_timestamp); }),
        maxBytes = d3.max(data, (d) => { return parseInt(d.nbytes_size, 10); });

    this._scaleFn = d3.scale.linear().domain([0, maxBytes]).range([SCALE_MIN, SCALE_MID, SCALE_MAX]);

    this.controls.select('[type="range"]')
      .attr('min', minDate)
      .attr('max', maxDate)
      .attr('value', minDate)
      .on('change', this.onChange(data));

    if (!this.dateInPicker) {
      this._dateInPicker = new Pikaday({
        field         : this.dateInField,
        defaultDate   : new Date(minDate),
        setDefaultDate: true,
        format        : DATE_FORMAT,
        onSelect      : this.onDateSelect.bind(this)
      });
    }

    if (!this.dateOutPicker) {
      this._dateOutPicker = new Pikaday({
        field         : this.dateOutField,
        defaultDate   : new Date(maxDate),
        setDefaultDate: true,
        format        : DATE_FORMAT,
        onSelect      : this.onDateSelect.bind(this)
      });
    }

    this.legend.select('div')
      .text(utils.humanFileSize(maxBytes));
  }

  /**
   * Get scale function
   *
   * @returns {Function}
   */
  get scaleFn () {
    return this._scaleFn;
  }

  /**
   * Get the controls
   *
   * @returns {d3.selection}
   */
  get controls () {
    return this._controls;
  }

  /**
   * Get the filters
   *
   * @returns {d3.selection}
   */
  get filters () {
    return this._filters;
  }

  get legend () {
    return this._legend;
  }

  /**
   * Get input field for date-in
   * @returns {HTMLInputElement}
   */
  get dateInField () {
    return this._dateInField;
  }

  /**
   * Get date picker of date-in field
   *
   * @returns {Pikaday}
   */
  get dateInPicker () {
    return this._dateInPicker;
  }

  /**
   * Get input field for date-out
   *
   * @returns {HTMLInputElement}
   */
  get dateOutField () {
    return this._dateOutField;
  }

  /**
   * Get date picker of date-out field
   *
   * @returns {Pikaday}
   */
  get dateOutPicker () {
    return this._dateOutPicker;
  }

  /**
   * Get playback mode
   *
   * @returns {String}
   */
  get mode () {
    return this._mode;
  }

  /**
   * Get tick interval
   *
   * @returns {Number}
   */
  get interval () {
    return this._interval;
  }
}
