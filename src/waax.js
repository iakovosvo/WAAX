/**
 * @fileOverview Web Audio API eXtension core library
 * @version 1.0.0-alpha
 * @author Hongchan Choi (hoch)
 * @license MIT
 */


// some on-the-fly data abstractions

/**
 * Contains a model for data binding.
 * @name WXModel
 * @example
 * var model = [
 *   { key:'Sine', value:'sine' },
 *   { key:'Sawtooth', value:'sawtooth' }
 *   ...
 * ];
 */

/**
 * WAAX abstraction of audio sample data.
 * @name WXClip
 * @example
 * var clip = {
 *   name: 'Cool Sample',
 *   url: 'http://mystaticdata.com/samples/coolsample.wav',
 *   buffer: null
 * };
 */

/**
 * WAAX abstraction of sampler instrument data.
 * @name WXZone
 * @example
 * var zone = {
 *   clip: WXClip
 *   basePitch: 60            // samples original pitch
 *   loop: true,
 *   loopStart: 0.1,
 *   loopEnd: 0.5,
 *   pitchLow: 12,            // pitch low bound
 *   pitchHigh: 96,           // pitch high bound
 *   velocityLow: 12,         // velocity lower bound
 *   velocityHigh: 127,       // velocity high bound
 *   pitchModulation: true,   // use pitch modulation
 *   velocityModulatio: true  // use velocity moduation
 * };
 */


/**
 * @namespace WX
 */
window.WX = (function () {

  'use strict';

  /**
   * Contains core library information.
   * @module Info
   * @memberOf WX
   */
  var Info = (function () {

    var api_version = '1.0.0-alpha';

    return {

      /**
       * Returns version number. (semantic version)
       * @static
       * @returns {number} API version number
       * @see  {@link http://semver.org/}
       */
      getVersion: function () {
        return api_version;
      }

    };

  })();


  /**
   * Features system-wide logging utilities.
   * @module Log
   * @memberOf WX
   */
  var Log = (function () {

    var logLevel = 1;
    var _c = window.console;

    return {

      /**
       * Sets logging level. (1: info, 2: warn, 3: error)
       * @static
       * @param {number} level logging level
       */
      setLevel: function (level) {
        logLevel = level;
      },

      /**
       * Prints an informative message on console.
       * @static
       * @param {...string} message messages to be printed
       */
      info: function () {
        if (logLevel > 1) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[WX:info]');
        _c.log.apply(_c, args);
      },

      /**
       * Prints a warning message on console.
       * @static
       * @param {...string} message messages to be printed.
       */
      warn: function () {
        if (logLevel > 2) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[WX:warn]');
        _c.log.apply(_c, args);
      },

      /**
       * Prints an error message on console and throws an error.
       * @static
       * @param {...string} message messages to be printed.
       */
      error: function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[WX:error]');
        _c.log.apply(_c, args);
        throw new Error('[WX:error]');
      }

    };

  })();


  /**
   * Features utilities for object manipulation, music math and more. Note that
   * all utility methods are under WX namespace.
   * @see For object manipulation: {@link http://underscorejs.org/docs/underscore.html}
   * @see For music math: {@link https://github.com/libpd/libpd/blob/master/pure-data/src/x_acoustics.c}
   */
  var Util = (function () {

    var LOG2 = Math.LN2,
        LOG10 = Math.LN10,
        MIDI1499 = 3.282417553401589e+38;

    return {

      /**
       * Checks if an argument is a JS object.
       * @memberOf  WX
       * @static
       * @returns {Boolean}
       */
      isObject: function (obj) {
        return obj === Object(obj);
      },

      /**
       * Checks if an argument is a JS function.
       * @memberOf  WX
       * @static
       * @returns {Boolean}
       */
      isFunction: function (fn) {
        return toString.call(fn) === '[object Function]';
      },

      /**
       * Checks if an argument is a JS array.
       * @memberOf  WX
       * @static
       * @returns {Boolean}
       */
      isArray: function (arr) {
        return toString.call(arr) === '[object Array]';
      },

      /**
       * Checks if the type of an argument is Number.
       * @memberOf  WX
       * @static
       * @returns {Boolean}
       */
      isNumber: function (num) {
        return toString.call(num) === '[object Number]';
      },

      /**
       * Checks if the type of an argument is Boolean.
       * @memberOf  WX
       * @static
       * @returns {Boolean}
       */
      isBoolean: function (bool) {
        return toString.call(bool) === '[object Boolean]';
      },

      /**
       * Checks if a WAAX plug-in has a parameter
       * @memberOf  WX
       * @static
       * @param {String} param Parameter name
       * @returns {Boolean}
       */
      hasParam: function(plugin, param) {
        return hasOwnProperty.call(plugin.params, param);
      },

      /**
       * Extends target object with the source object. If two objects have
       *   duplicates, properties in target object will be overwritten.
       * @memberOf  WX
       * @static
       * @param  {Object} target Object to be extended
       * @param  {Object} source Object to be injected
       * @returns {Object} A merged object.
       */
      extend: function (target, source) {
        for (var prop in source) {
          target[prop] = source[prop];
        }
        return target;
      },

      /**
       * Retunrs a clone of JS object. This returns shallow copy.
       * @memberOf  WX
       * @static
       * @param  {Object} source Object to be cloned
       * @returns {Object} Cloned object
       */
      clone: function (source) {
        var obj = {};
        for (var prop in source) {
          obj[prop] = source[prop];
        }
        return obj;
      },

      /**
       * Validates a WAAX model. This verifies if all the keys in the
       * model is unique. WAAX model is a collection of key-value pairs
       * that is useful for data binding or templating.
       * @memberOf  WX
       * @static
       * @param  {Array} model WAAX model
       * @returns {Boolean}
       * @example
       * // Example WAAX model for waveform types
       * var model = [
       *   { key:'Sine', value:'sine' },
       *   { key:'Sawtooth', value:'sawtooth' }
       *   ...
       * ];
       */
      validateModel: function (model) {
        if (model.length === 0) {
          return false;
        }
        var keys = [];
        for (var i = 0; i < model.length; i++) {
          if (keys.indexOf(model[i].key) > -1) {
            return false;
          } else {
            keys.push(model[i].key);
          }
        }
        return true;
      },

      /**
       * Finds a key from a model by a value.
       * @memberOf  WX
       * @static
       * @param  {Array} model WAAX model
       * @param  {*} value Value in model
       * @returns {String|null} Key or null when not found.
       * @see {@link WX.validateModel} for WAAX model specification.
       */
      findKeyByValue: function (model, value) {
        for (var i = 0; i < model.length; i++) {
          if (model[i].value === value) {
            return model[i].key;
          }
        }
        return null;
      },

      /**
       * Finds a value from a model by a key.
       * @memberOf  WX
       * @static
       * @param  {Array} model WAAX model
       * @param  {String} key Key in model
       * @returns {*|null} Value or null when not found.
       * @see {@link WX.validateModel} for WAAX model specification.
       */
      findValueByKey: function (model, key) {
        for (var i = 0; i < model.length; i++) {
          if (model[i].key === key) {
            return model[i].value;
          }
        }
        return null;
      },

      /**
       * Clamps a number into a range specified by min and max.
       * @memberOf  WX
       * @static
       * @param  {Number} value Value to be clamped
       * @param  {Number} min   Range minimum
       * @param  {Number} max   Range maximum
       * @return {Number}       Clamped value
       */
      clamp: function (value, min, max) {
        return Math.min(Math.max(value, min), max);
      },

      /**
       * Generates a floating point random number between min and max.
       * @memberOf  WX
       * @static
       * @param  {Number} min Range minimum
       * @param  {Number} max Range maximum
       * @return {Number}     A floating point random number
       */
      random2f: function (min, max) {
        return min + Math.random() * (max - min);
      },

      /**
       * Generates an integer random number between min and max.
       * @memberOf  WX
       * @static
       * @param  {Number} min Range minimum
       * @param  {Number} max Range maximum
       * @return {Number}     An integer random number
       */
      random2: function (min, max) {
        return Math.round(min + Math.random() * (max - min));
      },

      /**
       * Converts a MIDI pitch number to frequency.
       * @memberOf  WX
       * @static
       * @param  {Number} midi MIDI pitch (0 ~ 127)
       * @return {Number}      Frequency (Hz)
       */
      mtof: function (midi) {
        if (midi <= -1500) return 0;
        else if (midi > 1499) return MIDI1499;
        else return 440.0 * Math.pow(2, (Math.floor(midi) - 69) / 12.0);
      },

      /**
       * Converts frequency to MIDI pitch.
       * @memberOf  WX
       * @static
       * @param  {Number} freq Frequency
       * @return {Number}      MIDI pitch
       */
      ftom: function (freq) {
        return Math.floor(
          freq > 0 ?
          Math.log(freq/440.0) / LOG2 * 12 + 69 : -1500
        );
      },

      /**
       * Converts power to decibel. Note that it is off by 100dB to make it
       *   easy to use MIDI velocity to change volume. This is the same
       *   convention that PureData uses. This behaviour might change in the
       *   future.
       * @memberOf  WX
       * @static
       * @param  {Number} power Power
       * @return {Number}       Decibel
       * @see https://lists.cs.princeton.edu/pipermail/chuck-users/2009-May/004182.html
       */
      powtodb: function (power) {
        if (power <= 0) return 0;
        else {
          var db = 100 + 10.0 / LOG10 * Math.log(power);
          return db < 0 ? 0 : db;
        }
      },

      /**
       * Converts decibel to power. Note that it is off by 100dB to make it
       *   easy to use MIDI velocity to change volume. This is the same
       *   convention that PureData uses. This behaviour might change in the
       *   future.
       * @memberOf  WX
       * @static
       * @param  {Number} db Decibel
       * @return {Number}    Power
       * @see https://lists.cs.princeton.edu/pipermail/chuck-users/2009-May/004182.html
       */
      dbtopow: function (db) {
        if (db <= 0) return 0;
        else {
          // TODO: what is 870?
          if (db > 870) db = 870;
          return Math.exp(LOG10 * 0.1 * (db - 100.0));
        }
      },

      /**
       * Converts RMS(root-mean-square) to decibel.
       * @memberOf  WX
       * @static
       * @param  {Number} rms RMS value
       * @return {Number}     Decibel
       */
      rmstodb: function (rms) {
        if (rms <= 0) return 0;
        else {
          var db = 100 + 20.0 / LOG10 * Math.log(rms);
          return db < 0 ? 0 : db;
        }
      },

      /**
       * Converts decibel to RMS(root-mean-square).
       * @memberOf  WX
       * @static
       * @param  {Number} db  Decibel
       * @return {Number}     RMS value
       */
      dbtorms: function (db) {
        if (db <= 0) return 0;
        else {
          // TODO: what is 485?
          if (db > 485) db = 485;
          return Math.exp(LOG10 * 0.05 * (db - 100.0));
        }
      },

      /**
       * Converts linear amplitude to decibel.
       * @memberOf  WX
       * @static
       * @param  {Number} lin Linear amplitude
       * @return {Number}     Decibel
       */
      lintodb: function (lin) {
        // if below -100dB, set to -100dB to prevent taking log of zero
        return 20.0 * (lin > 0.00001 ? (Math.log(lin) / LOG10) : -5.0);
      },

      /**
       * Converts decibel to linear amplitude. Useful for dBFS conversion.
       * @memberOf  WX
       * @static
       * @param  {Number} db  Decibel
       * @return {Number}     Linear amplitude
       */
      dbtolin: function (db) {
        return Math.pow(10.0, db / 20.0);
      },

      /**
       * Converts MIDI velocity to linear amplitude.
       * @memberOf  WX
       * @static
       * @param  {Number} velocity MIDI velocity
       * @return {Number}     Linear amplitude
       */
      veltoamp: function (velocity) {
        // TODO: velocity curve here?
        return velocity / 127;
      }

    };
  })();

  // Feature detection and monkey patching: AudioContext
  if (!window.hasOwnProperty('webkitAudioContext') &&
    !window.hasOwnProperty('AudioContext')) {
    // FATAL: non-supported browser. stop everything and escape.
    Log.error('Web Audio API is not supported. ' +
      'See http://caniuse.com/audio-api for more info.');
  } else {
    if (window.hasOwnProperty('webkitAudioContext')) {
      window.AudioContext = window.webkitAudioContext;
    }
  }

  /**
   * WAAX core. Abstracts various Web Audio API features.
   */
  var Core = (function () {

    // context
    var ctx = new AudioContext();
    // caching AudioParam
    var WAP = window.AudioParam.prototype;

    /**
     * Injects into window.AudioNode
     * @namespace AudioNode
     */

    /**
     * Connects a WA node to the other WA nodes. Note that this method is
     *   injected to AudioNode.prototype. Supports multiple outgoing
     *   connections. (fanning out) Returns the first WA node to enable method
     *   chaining.
     * @memberOf AudioNode
     * @param {...AudioNode} target WA nodes.
     * @return {AudioNode} The first target WA node.
     */
    AudioNode.prototype.to = function () {
      for (var i = 0; i < arguments.length; i++) {
        this.connect(arguments[i]);
      }
      return arguments[0];
    };

    /**
     * Disconnects outgoing connection of a WA node. Note that this method is
     *   injected to AudioNode.prototype.
     * @memberOf AudioNode
     */
    AudioNode.prototype.cut = function () {
      this.disconnect();
    };

    /**
     * Injects into window.AudioParam
     * @namespace AudioParam
     */

    /**
     * Equivalent of AudioParam.cancelScheduledValues. Cancels scheduled value
     *   after a given starting time.
     * @memberOf AudioParam
     * @method
     * @see  http://www.w3.org/TR/webaudio/#dfn-cancelScheduledValues
     */
    AudioParam.prototype.cancel = WAP.cancelScheduledValues;

    /**
     * Manipulates AudioParam dynamically.
     * @memberOf AudioParam
     * @param {Number} value Target parameter value
     * @param {Number|Array} time Automation start time. With rampType 3, this
     *   argument must be an array specifying [start time, time constant].
     * @param {Number} rampType Automation ramp type. 0 = step, 1 = linear,
     *   2 = exponential, 3 = target value <code>start, time constant]</code>
     * @see  http://www.w3.org/TR/webaudio/#methodsandparams-AudioParam-section
     */
    AudioParam.prototype.set = function (value, time, rampType) {
      switch (rampType) {
        case 0:
        case undefined:
          time = (time < ctx.currentTime) ? ctx.currentTime : time;
          this.setValueAtTime(value, time);
          // when node is not connected, automation will not work
          // this hack handles the error
          if (time <= ctx.currentTime && value !== this.value) {
            this.value = value;
          }
          break;
        case 1:
          time = (time < ctx.currentTime) ? ctx.currentTime : time;
          this.linearRampToValueAtTime(value, time);
          break;
        case 2:
          time = (time < ctx.currentTime) ? ctx.currentTime : time;
          value = value <= 0.0 ? 0.00001 : value;
          this.exponentialRampToValueAtTime(value, time);
          break;
        case 3:
          time[0] = (time[0] < ctx.currentTime) ? ctx.currentTime : time[0];
          value = value <= 0.0 ? 0.00001 : value;
          this.setTargetAtTime(value, time[0], time[1]);
          break;
      }
    };

    /**
     * Create an envelope generator function for WA audioParam.
     * @memberOf  WX
     * @static
     * @param {...Array} array Data points of
     *   <code>[value, offset time, ramp type]<code>
     * @returns {Function} Envelope generator function.
     *   <code>function(start time, scale factor)</code>
     * @example
     * // build an envelope generator with relative data points
     * var env = WX.Envelope([0.0, 0.0], [0.8, 0.01, 1], [0.0, 0.3, 2]);
     * // changes gain with an envelope starts at 2.0 sec with 1.2
     *   amplification.
     * synth.set('gain', env(2.0, 1.2));
     */
    function Envelope() {
      var args = arguments;

      //  * Generates envelope based on a offset time.
      //  * @method
      //  * @param  {Number} startTime Start offset (seconds)
      //  * @param  {Number} amplifier Scale factor for data point.
      //  * @returns {Array}           Data point (envelope) array.

      return function (startTime, amplifier) {
        var env = [];
        startTime = (startTime || 0);
        amplifier = (amplifier || 1.0);
        for (var i = 0; i < args.length; i++) {
          var val = args[i][0], time;
          // when time argument is array, branch to setTargetAtValue
          if (Util.isArray(args[i][1])) {
            time = [startTime + args[i][1][0], startTime + args[i][1][1]];
            env.push([val * amplifier, time, 3]);
          }
          // otherwise use step, linear or exponential ramp
          else {
            time = startTime + args[i][1];
            env.push([val * amplifier, time, (args[i][2] || 0)]);
          }
        }
        return env;
      };
    }

    /**
     * Loads WAAX clip by XHR loading
     * @memberOf  WX
     * @static
     * @param  {Object} clip WAAX Clip
     * @param  {callback_loadClip_oncomplete} oncomplete Function called when
     *   completed.
     * @param  {callback_loadClip_onprogress} onprogress <i>Optional.</i>
     *   Callback for progress report.
     * @example
     * // Creates a WAAX clip on the fly.
     * var clip = {
     *   name: 'Cool Sample',
     *   url: 'http://mystaticdata.com/samples/coolsample.wav',
     *   buffer: null
     * };
     * // Loads the clip and assign the buffer to a sampler plug-in.
     * WX.loadClip(clip, function (clip) {
     *   mySampler.setBuffer(clip.buffer);
     * });
     */
    function loadClip(clip, oncomplete, onprogress) {
      if (!oncomplete) {
        Log.error('Specify `oncomplete` action.');
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', clip.url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function (event) {
        if (onprogress) {
          onprogress(event, clip);
        }
      };
      xhr.onload = function (event) {
        try {
          Core.ctx.decodeAudioData(
            xhr.response,
            function (buffer) {
              clip.buffer = buffer;
              oncomplete(clip);
            }
          );
        } catch (error) {
          Info.error(
            'Loading clip failed. (XHR failure)',
            error.message,
            clip.url
          );
        }
      };
      xhr.send();
    }

    /**
     * Callback for clip loading completion. Called by {@link WX.loadClip}.
     * @callback callback_loadClip_oncomplete
     * @param {Object} clip WAAX clip
     * @see {@link WX.loadClip}
     */

    /**
     * Callback for progress report called by {@link WX.loadClip}.
     * @callback callback_loadClip_onprogress
     * @param {Object} event XHR progress event object
     * @param {Object} clip WAAX clip
     * @see {@link WX.loadClip}
     * @see {@link https://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html}
     */

    // internal argument validation
    function checkNumeric(arg, defaultValue) {
      if (Util.isNumber(arg)) {
        return arg;
      } else if (arg === undefined) {
        return defaultValue;
      } else {
        Log.error('Invalid parameter configuration');
      }
    }

    // Parameter factory. Creates an instance of paramter class.
    function createParam(options) {
      if (PARAM_TYPES.indexOf(options.type) < 0) {
        Log.error('Invalid Parameter Type.');
      }
      switch (options.type) {
        case 'Generic':
          return new GenericParam(options);
        case 'Itemized':
          return new ItemizedParam(options);
        case 'Boolean':
          return new BooleanParam(options);
      }
    }


    // Parameter Abstraction

    // for internal reference
    var PARAM_TYPES = [
      'Generic',
      'Itemized',
      'Boolean'
    ];

    // for internal reference
    var PARAM_UNITS = [
      '',
      'Octave',
      'Semitone',
      'Seconds',
      'Milliseconds',
      'Samples',
      'Hertz',
      'Cents',
      'Decibels',
      'LinearGain',
      'Percent',
      'BPM'
    ];

    /**
     * Generic parameter(numerical and ranged) abstraction. Usually called by
     *   {@link WX.defineParams} method.
     * @memberOf WX
     * @private
     * @class
     * @param {Object} options Parameter configruation.
     * @param {String} options.name User-defined parameter name.
     * @param {String} options.unit Parameter unit.
     * @param {Number} options.default Default value.
     * @param {Number} options.value Parameter value.
     * @param {Number} options.min Minimum value.
     * @param {Number} options.max Maximum value.
     * @param {Object} options._parent Reference to associated Plug-in.
     */
    function GenericParam(options) {
      this.init(options);
    }

    GenericParam.prototype = {

      /**
       * Initializes instance with options.
       * @memberOf WX.GenericParam
       * @param  {Object} options Paramter configuration.
       * @see {@link Core.GenericParam}
       */
      init: function (options) {
        this.type = 'Generic';
        this.name = (options.name || 'Parameter');
        this.unit = (options.unit || '');
        this.value = this.default = checkNumeric(options.default, 0.0);
        this.min = checkNumeric(options.min, 0.0);
        this.max = checkNumeric(options.max, 1.0);
        // parent, reference to the plug-in
        this._parent = options._parent;
        // handler callback
        this.$callback = options._parent['$' + options._paramId];
      },

      /**
       * Sets parameter value with time and ramp type. Calls back
       *   a corresponding handler.
       * @memberOf WX.GenericParam
       * @param {Number} value Parameter target value
       * @param {Number|Array} time time or array of [start time, time constant]
       * @param {Number} rampType WAAX ramp type
       */
      set: function (value, time, rampType) {
        // set value in this parameter instance
        this.value = Util.clamp(value, this.min, this.max);
        // then call hander if it's defined
        if (this.$callback) {
          this.$callback.call(this._parent, this.value, time, rampType);
        }
      },

      /**
       * Returns the paramter value. Note that this is not a computed value
       *   of WA AudioParam instance.
       * @memberOf WX.GenericParam
       * @return {Number} Latest paramter value.
       */
      get: function () {
        return this.value;
      }

    };

    /**
     * Itemized parameter abstraction. Usually called by {@link WX.defineParams}
     *   method.
     * @memberOf WX
     * @private
     * @class
     * @param {Object} options Parameter configruation.
     * @param {String} options.name User-defined parameter name.
     * @param {String} options.model Option items.
     * @param {Number} options.default Default item.
     * @param {Number} options.value Current item.
     * @param {Object} options._parent Reference to associated Plug-in.
     */
    function ItemizedParam(options) {
      this.init(options);
    }

    ItemizedParam.prototype = {

      /**
       * Initializes instance with options.
       * @memberOf WX.ItemizedParam
       * @param  {Object} options Paramter configuration.
       * @see {@link Core.ItemizedParam}
       */
      init: function (options) {
        // assertion
        if (!Util.isArray(options.model)) {
          Log.error('Model is missing.');
        }
        if (!Util.validateModel(options.model)) {
          Log.error('Invalid Model.');
        }
        // initialization
        this.type = 'Itemized';
        this.name = (options.name || 'Select');
        this.model = options.model;
        this.default = (options.default || this.model[0].value);
        this.value = this.default;
        // caching parent
        this._parent = options._parent;
        // handler callback assignment
        this.$callback = options._parent['$' + options._paramId];
      },

      /**
       * Sets parameter value with time and ramp type. Calls back
       *   a corresponding handler.
       * @memberOf WX.ItemizedParam
       * @param {Number} value Parameter target value
       * @param {Number|Array} time time or array of
       *   <code>[start time, time constant]</code>
       * @param {Number} rampType WAAX ramp type
       */
      set: function (value, time, rampType) {
        // check if value is valid
        if (Util.findKeyByValue(this.model, value)) {
          this.value = value;
          if (this.$callback) {
            this.$callback.call(this._parent, this.value, time, rampType);
          }
        }
      },

      /**
       * Returns the paramter value. Note that this is not a computed value
       *   of WA AudioParam instance.
       * @memberOf WX.ItemizedParam
       * @return {Number} Latest paramter value.
       */
      get: function () {
        return this.value;
      },

      /**
       * Returns the reference of items (WAAX model).
       * @memberOf WX.ItemizedParam
       * @return {Array} WAAX model associated with the parameter.
       */
      getModel: function () {
        return this.model;
      }

    };


    /**
     * Boolean parameter abstraction. Usually called by {@link WX.defineParams}
     *   method.
     * @memberOf WX
     * @private
     * @class
     * @param {Object} options Parameter configruation.
     * @param {String} options.name User-defined parameter name.
     * @param {Number} options.default Default value.
     * @param {Number} options.value Current value.
     * @param {Object} options._parent Reference to associated Plug-in.
     */
    function BooleanParam(options) {
      this.init(options);
    }

    BooleanParam.prototype = {

      /**
       * Initializes instance with options.
       * @memberOf WX.BooleanParam
       * @param {Object} options Paramter configuration.
       * @see {@link WX.BooleanParam}
       */
      init: function (options) {
        if (!Util.isBoolean(options.default)) {
          Log.error('Invalid value for Boolean Parameter.');
        }
        this.type = 'Boolean';
        this.name = (options.name || 'Toggle');
        this.value = this.default = options.default;
        this._parent = options._parent;
        // handler callback assignment
        this.$callback = options._parent['$' + options._paramId];
      },

      /**
       * Sets parameter value with time and ramp type. Calls back
       *   a corresponding handler.
       * @memberOf WX.BooleanParam
       * @param {Number} value Parameter target value
       * @param {Number|Array} time time or array of
       *   <code>[start time, time constant]</code>
       * @param {Number} rampType WAAX ramp type
       */
      set: function (value, time, rampType) {
        if (Util.isBoolean(value)) {
          this.value = value;
          if (this.$callback) {
            this.$callback.call(this._parent, this.value, time, rampType);
          }
        }
      },

      /**
       * Returns the paramter value. Note that this is not a computed value
       *   of WA AudioParam instance.
       * @memberOf WX.ItemizedParam
       * @return {Number} Latest paramter value.
       */
      get: function () {
        return this.value;
      }

    };


    // exports
    return {

      // audio context
      ctx: ctx,

      /**
       * Creates an instance of WA Gain node.
       * @memberOf WX
       * @return {AudioNode} WA Gain node.
       * @see  http://www.w3.org/TR/webaudio/#GainNode
       */
      Gain: function() {
        return ctx.createGain();
      },

      /**
       * Creates an instance of WA Oscillator node.
       * @memberOf WX
       * @return {AudioNode} WA Oscillator node.
       * @see  http://www.w3.org/TR/webaudio/#OscillatorNode
       */
      OSC: function() {
        return ctx.createOscillator();
      },

      /**
       * Creates an instance of WA Delay node.
       * @memberOf WX
       * @return {AudioNode} WA Delay node.
       * @see  http://www.w3.org/TR/webaudio/#DelayNode
       */
      Delay: function() {
        return ctx.createDelay();
      },

      /**
       * Creates an instance of WA BiquadFilter node.
       * @memberOf WX
       * @return {AudioNode} WA BiquadFilter node.
       * @see  http://www.w3.org/TR/webaudio/#BiquadFilterNode
       */
      Filter: function() {
        return ctx.createBiquadFilter();
      },

      /**
       * Creates an instance of WA DynamicCompressor node.
       * @memberOf WX
       * @return {AudioNode} WA DynamicsCompressor node.
       * @see  http://www.w3.org/TR/webaudio/#DynamicsCompressorNode
       */
      Comp: function() {
        return ctx.createDynamicsCompressor();
      },

      /**
       * Creates an instance of WA Convolver node.
       * @memberOf WX
       * @return {AudioNode} WA Convolver node.
       * @see  http://www.w3.org/TR/webaudio/#ConvolverNode
       */
      Convolver: function() {
        return ctx.createConvolver();
      },

      /**
       * Creates an instance of WA WaveShaper node.
       * @memberOf WX
       * @return {AudioNode} WA WaveShaper node.
       * @see  http://www.w3.org/TR/webaudio/#WaveShaperNode
       */
      WaveShaper: function() {
        return ctx.createWaveShaper();
      },

      /**
       * Creates an instance of WA BufferSource node.
       * @memberOf WX
       * @return {AudioNode} WA BufferSource node.
       * @see  http://www.w3.org/TR/webaudio/#BufferSourceNode
       */
      Source: function() {
        return ctx.createBufferSource();
      },

      /**
       * Creates an instance of WA Analyzer node.
       * @memberOf WX
       * @return {AudioNode} WA Analyzer node.
       * @see  http://www.w3.org/TR/webaudio/#AnalyzerNode
       */
      Analyzer: function() {
        return ctx.createAnalyser();
      },

      /**
       * Creates an instance of WA Panner node.
       * @memberOf WX
       * @return {AudioNode} WA Panner node.
       * @see  http://www.w3.org/TR/webaudio/#PannerNode
       */
      Panner: function() {
        return ctx.createPanner();
      },

      /**
       * Creates an instance of WA PerodicWave object.
       * @memberOf WX
       * @return {AudioNode} WA PeriodicWave object.
       * @see  http://www.w3.org/TR/webaudio/#PeriodicWave
       */
      PeriodicWave: function () {
        return ctx.createPeriodicWave.apply(ctx, arguments);
      },

      /**
       * Creates an instance of WA Splitter node.
       * @memberOf WX
       * @return {AudioNode} WA Splitter node.
       * @see  http://www.w3.org/TR/webaudio/#SplitterNode
       */
      Splitter: function () {
        return ctx.createChannelSplitter.apply(ctx, arguments);
      },

      /**
       * Creates an instance of WA Merger node.
       * @memberOf WX
       * @method
       * @return {AudioNode} WA Merger node.
       * @see  http://www.w3.org/TR/webaudio/#MergerNode
       */
      Merger: function () {
        return ctx.createChannelMerger.apply(ctx, arguments);
      },

      /**
       * Creates an instance of WA Buffer object.
       * @memberOf WX
       * @return {AudioNode} WA Buffer object.
       * @see  http://www.w3.org/TR/webaudio/#Buffer
       */
      Buffer: function () {
        return ctx.createBuffer.apply(ctx, arguments);
      },

      // envlope generator
      Envelope: Envelope,

      /**
       * Defines parameters by specified options.
       * @memberOf WX
       * @param  {Object} plugin       WAAX Plug-in
       * @param  {Object} paramOptions A collection of parameter option objects
       *   . See {@link Core.GenericParam}, {@link Core.ItemizedParam} and
       *   {@link Core.BooleanParam} for available parameter options.
       * @see  {@link Core.GenericParam}
       * @see  {@link Core.ItemizedParam}
       * @see  {@link Core.BooleanParam}
       * @example
       * WX.defineParams(this, {
       *   oscFreq: {
       *     type: 'Generic',
       *     name: 'Freq',
       *     default: WX.mtof(60),
       *     min: 20.0,
       *     max: 5000.0,
       *     unit: 'Hertz'
       *   },
       *   ...
       * };
       */
      defineParams: function (plugin, paramOptions) {
        for (var key in paramOptions) {
          paramOptions[key]._parent = plugin;
          paramOptions[key]._paramId = key;
          plugin.params[key] = createParam(paramOptions[key]);
        }
      },

      // load clip via xhr
      loadClip: loadClip

    };

  })();


  /**
   * Plug-In related internal classes and utilities.
   * @module PlugIn
   * @memberOf WX
   */
  var PlugIn = (function () {

    // plug-in types
    var PLUGIN_TYPES = [
      'Generator',
      'Processor',
      'Analyzer'
    ];

    // registered plug-ins
    var registered = {
      Generator: [],
      Processor: [],
      Analyzer: []
    };

    /**
     * Plug-In abstract class.
     * @class
     * @private
     */
    function PlugInAbstract () {
      this.params = {};
    }

    PlugInAbstract.prototype = {

      /**
       * Connects a plug-in output to the other plug-in's input or a WA node.
       *   Note that this does not support multiple outgoing connection.
       *   (fanning-out)
       * @memberOf PlugInAbstract
       * @param {WAPLPlugIn|AudioNode} plugin WAPL(Web Audio Plug-In)
       *   compatible plug-in or WA node.
       */
      to: function (plugin) {
        // if the target is plugin with inlet
        if (plugin._inlet) {
          this._outlet.to(plugin._inlet);
          return plugin;
        }
        // or it might be a WA node
        else {
          try {
            this._outlet.to(plugin);
            return plugin;
          } catch (error) {
            Log.error('Connection failed. Invalid patching.');
          }
        }
      },

      /**
       * Disconnects a plug-in output.
       * @memberOf PlugInAbstract
       */
      cut: function () {
        this._outlet.cut();
      },

      /**
       * Sets a plug-in parameter. Supports dynamic parameter assignment.
       * @memberOf PlugInAbstract
       * @param {String} param Parameter name.
       * @param {Array|Number} arg An array of data points or a single value.
       * @return {WAPL} Self-reference for method chaining.
       * @example
       * // setting parameter with an array
       * myeffect.set('gain', [[0.0], [1.0, 0.01, 1], [0.0, 0.5, 2]]);
       * // setting parameter with a value (immediate change)
       * myeffect.set('gain', 0.0);
       */
      set: function (param, arg) {
        if (Util.hasParam(this, param)) {
          // check if arg is a value or array
          if (Util.isArray(arg)) {
            // if env is an array, iterate envelope data
            // where array is arg_i = [value, time, rampType]
            for (var i = 0; i < arg.length; i++) {
              this.params[param].set.apply(this, arg[i]);
            }
          } else {
            // otherwise change the value immediately
            this.params[param].set(arg, Core.ctx.currentTime, 0);
          }
        }
        return this;
      },

      /**
       * Gets a paramter value.
       * @param {String} param Parameter name.
       * @return {*} Paramter value. Returns null when a paramter not found.
       */
      get: function (param) {
        if (Util.hasParam(this, param)) {
          return this.params[param].get();
        } else {
          return null;
        }
      },

      /**
       * Sets plug-in preset, which is a collection of parameters. Note that
       *   setting a preset changes all the associated parameters immediatley.
       * @param {Object} preset A collection of paramters.
       */
      setPreset: function (preset) {
        for (var param in preset) {
          this.params[param].set(preset[param], Core.ctx.currentTime, 0);
        }
      },

      /**
       * Gets a current plug-in paramters as a collection. Note that the
       *   collection is created on the fly. It is a clone of current parameter
       *   values.
       * @return {Object} Preset.
       */
      getPreset: function () {
        var preset = {};
        for (var param in this.params) {
          preset[param] = this.params[param].get();
        }
        return preset;
      }

    };


    /**
     * Generator plug-in class. No audio inlet.
     * @class
     * @private
     * @extends PlugInAbstract
     * @wxparam {Generic} output Output gain.
     */
    function GeneratorAbstract() {

      // extends PlugInAbstract
      PlugInAbstract.call(this);

      // creating essential WA nodes
      this._output = Core.Gain();
      this._outlet = Core.Gain();
      // and patching
      this._output.to(this._outlet);

      // paramter definition
      Core.defineParams(this, {

        output: {
          type: 'Generic',
          name: 'Output',
          default: 1.0,
          min: 0.0,
          max: 1.0,
          unit: 'LinearGain'
        }

      });

    }

    GeneratorAbstract.prototype = {

      /**
       * @wxhandler output
       */
      $output: function (value, time, rampType) {
        this._output.gain.set(value, time, rampType);
      }

    };

    // extends PlugInAbstract
    Util.extend(GeneratorAbstract.prototype, PlugInAbstract.prototype);


    /**
     * Processor plug-in class. Features both inlet and outlet.
     * @class
     * @private
     * @extends PlugInAbstract
     * @wxparam {Generic} input Input gain.
     * @wxparam {Generic} output Output gain.
     * @wxparam {Boolean} bypass Bypass switch.
     */
    function ProcessorAbstract() {

      // extends PlugInAbstract
      PlugInAbstract.call(this);

      // WA nodes
      this._inlet = Core.Gain();
      this._input = Core.Gain();
      this._output = Core.Gain();
      this._active = Core.Gain();
      this._bypass = Core.Gain();
      this._outlet = Core.Gain();
      // patching
      this._inlet.to(this._input, this._bypass);
      this._output.to(this._active).to(this._outlet);
      this._bypass.to(this._outlet);

      // initialization for bypass
      this._active.gain.value = 1.0;
      this._bypass.gain.value = 0.0;

      Core.defineParams(this, {

        input: {
          type: 'Generic',
          name: 'Input',
          default: 1.0,
          min: 0.0,
          max: 1.0,
          unit: 'LinearGain'
        },

        output: {
          type: 'Generic',
          name: 'Output',
          default: 1.0,
          min: 0.0,
          max: 1.0,
          unit: 'LinearGain'
        },

        bypass: {
          type: 'Boolean',
          name: 'Bypass',
          default: false
        }

      });

    }

    ProcessorAbstract.prototype = {

      /**
       * @wxhandler input
       */
      $input: function (value, time, rampType) {
        this._input.gain.set(value, time, rampType);
      },

      /**
       * @wxhandler output
       */
      $output: function (value, time, rampType) {
        this._output.gain.set(value, time, rampType);
      },

      /**
       * @wxhandler bypass
       */
      $bypass: function(value, time, rampType) {
        time = (time || Core.ctx.currentTime);
        if (value) {
          this._active.gain.set(0.0, time, 0);
          this._bypass.gain.set(1.0, time, 0);
        } else {
          this._active.gain.set(1.0, time, 0);
          this._bypass.gain.set(0.0, time, 0);
        }
      }

    };

    // extends PlugInAbstract
    Util.extend(ProcessorAbstract.prototype, GeneratorAbstract.prototype);


    /**
     * Analyzer plug-in class. Features both inlet, outlet and analyzer.
     * @class
     * @private
     * @extends PlugInAbstract
     * @wxparam {Generic} input Input gain.
     */
    function AnalyzerAbstract() {

      PlugInAbstract.call(this);

      this._inlet = Core.Gain();
      this._input = Core.Gain();
      this._analyzer = Core.Analyzer();
      this._outlet = Core.Gain();

      this._inlet.to(this._input).to(this._analyzer);
      this._inlet.to(this._outlet);

      Core.defineParams(this, {

        input: {
          type: 'Generic',
          name: 'Input',
          default: 1.0,
          min: 0.0,
          max: 1.0,
          unit: 'LinearGain'
        }

      });

    }

    AnalyzerAbstract.prototype = {

      /**
       * @wxhandler input
       */
      $input: function (value, time, xtype) {
        this._input.gain.set(value, time, xtype);
      }

    };

    // extends PlugInAbstract
    Util.extend(AnalyzerAbstract.prototype, PlugInAbstract.prototype);

    // PlugIn exports
    return {

      /**
       * Defines type of a plug-in. Required in plug-in definition.
       * @param {WAPL} plugin Target plug-in.
       * @param {String} type Plug-in type. <code>['Generator', 'Processor',
       *   'Analyzer']</code>
       */
      defineType: function (plugin, type) {
        // check: length should be less than 3
        if (PLUGIN_TYPES.indexOf(type) < 0) {
          Log.error('Invalid Plug-in type.');
        }
        // branch on plug-in type
        switch (type) {
          case 'Generator':
            GeneratorAbstract.call(plugin);
            break;
          case 'Processor':
            ProcessorAbstract.call(plugin);
            break;
          case 'Analyzer':
            AnalyzerAbstract.call(plugin);
            break;
        }
      },

      /**
       * Initializes plug-in preset. Merges default preset with user-defined
       *   preset. Required in plug-in definition.
       * @param {WAPL} plugin Target plug-in.
       * @param {Object} preset Preset.
       */
      initPreset: function (plugin, preset) {
        var merged = Util.clone(plugin.defaultPreset);
        Util.extend(merged, preset);
        plugin.setPreset(merged);
      },

      /**
       * Extends plug-in prototype according to the type. Required in plug-in
       *   definition.
       * @param {WAPL} plugin Target plug-in.
       * @param {String} type Plug-in type. <code>['Generator', 'Processor',
       *   'Analyzer']</code>
       */
      extendPrototype: function (plugin, type) {
        // check: length should be less than 3
        if (PLUGIN_TYPES.indexOf(type) < 0) {
          Log.error('Invalid Plug-in type.');
        }
        // branch on plug-in type
        switch (type) {
          case 'Generator':
            Util.extend(plugin.prototype, GeneratorAbstract.prototype);
            break;
          case 'Processor':
            Util.extend(plugin.prototype, ProcessorAbstract.prototype);
            break;
          case 'Analyzer':
            Util.extend(plugin.prototype, AnalyzerAbstract.prototype);
            break;
        }
      },

      /**
       * Registers the plug-in prototype to WX namespace. Required in plug-in
       *   definition.
       * @param {Function} PlugInClass Class reference (function name) of
       *   plug-in.
       */
      register: function (PlugInClass) {
        var info = PlugInClass.prototype.info;
        // hard check version info
        if (Info.getVersion() > info.api_version) {
          // FATAL: PlugInClass is incompatible with WX Core.
          Log.error(PlugInClass.name, ': FATAL. incompatible WAAX version.');
        }
        // register PlugInClass in WX namespace
        registered[info.type].push(PlugInClass.name);
        window.WX[PlugInClass.name] = function (preset) {
          return new PlugInClass(preset);
        };
      },

      /**
       * Returns a list of regsitered plug-ins of a certain type.
       * @param {String} type Plug-in Type.
       * @return {Array} A list of plug-ins.
       */
      getRegistered: function (type) {
        var plugins = null;
        if (PLUGIN_TYPES.indexOf(type) > -1) {
          switch (type) {
            case 'Generator':
              plugins = registered.Generator.slice(0);
              break;
            case 'Processor':
              plugins = registered.Processor.slice(0);
              break;
            case 'Analyzer':
              plugins = registered.Analyzer.slice(0);
              break;
          }
        }
        return plugins;
      }

    };

  })();


  // initialization and bootup
  (function () {
    Log.info('WAAX', Info.getVersion(), '(' + Core.ctx.sampleRate + 'Hz)');
  })();


  // WX Exports
  return {

    // Info, Log
    Info: Info,
    Log: Log,

    // const
    WAVEFORMS: [
      { key: 'Sine', value: 'sine' },
      { key: 'Square', value: 'square' },
      { key: 'Sawtooth', value: 'sawtooth' },
      { key: 'Triangle', value: 'triangle' }
    ],
    FILTER_TYPES: [
      { key:'LP' , value: 'lowpass' },
      { key:'HP' , value: 'highpass' },
      { key:'BP' , value: 'bandpass' },
      { key:'LS' , value: 'lowshelf' },
      { key:'HS' , value: 'highshelf' },
      { key:'PK' , value: 'peaking' },
      { key:'BR' , value: 'notch' },
      { key:'AP' , value: 'allpass' }
    ],

    // Util: Object
    isObject: Util.isObject,
    isFunction: Util.isFunction,
    isArray: Util.isArray,
    isNumber: Util.isNumber,
    isBoolean: Util.isBoolean,
    hasParam: Util.hasParam,
    extend: Util.extend,
    clone: Util.clone,

    // Util: model manager
    validateModel: Util.validateModel,
    findKeyByValue: Util.findKeyByValue,
    findValueByKey: Util.findValueByKey,

    // Util: Music Math
    clamp: Util.clamp,
    random2f: Util.random2f,
    random2: Util.random2,
    mtof: Util.mtof,
    ftom: Util.ftom,
    powtodb: Util.powtodb,
    dbtopow: Util.dbtopow,
    rmstodb: Util.rmstodb,
    dbtorms: Util.dbtorms,
    lintodb: Util.lintodb,
    dbtolin: Util.dbtolin,
    veltoamp: Util.veltoamp,

    // WAAX Core
    context: Core.ctx,
    // TODO: these getters uses deprecated syntax.
    get now() {
      return Core.ctx.currentTime;
    },
    get srate() {
      return Core.ctx.sampleRate;
    },
    Gain: Core.Gain,
    OSC: Core.OSC,
    Delay: Core.Delay,
    Filter: Core.Filter,
    Comp: Core.Comp,
    Convolver: Core.Convolver,
    WaveShaper: Core.WaveShaper,
    Source: Core.Source,
    Analyzer: Core.Analyzer,
    Panner: Core.Panner,
    PeriodicWave: Core.PeriodicWave,
    Splitter: Core.Splitter,
    Merger: Core.Merger,
    Buffer: Core.Buffer,
    Envelope: Core.Envelope,
    defineParams: Core.defineParams,
    loadClip: Core.loadClip,

    // Plug-in builders
    PlugIn: PlugIn

  };

})();