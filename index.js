////////////////////////////////////////////////////////////////////////////////
//
// AwayMode - Homebridge plugin that provides triggers to turn on and turn off
//            lights to simulate occupancy. We provide the triggers, you provide
//            the lights.
//
// A simulated switch is created that controls whether "away mode" is active.
// When the switch is on, away mode is active. When the switch is off, away mode
// is inactive. A set of simulated sensors detect "activity". When activity
// (motion) is detected, turn the light on. When activity (motion) is not
// detected, turn the light off. The behavior of each sensor is random: a sensor
// is off for a period of time, turns on for a period of time, then repeats.
// When the switch is turned on, the sensors are activiated to start their
// off/on behavior. When the switch is turned off, the sensors are deactived
// and turned off.
//
// Config - (defaults in parenthesis)
//
// name - The name of the switch. ("Away Mode")
// sensorNames - Array of names for each sensor to be created. (["Trigger 1"])
// sensors - Array of per-sensor information.
// minOffTime - Minimum off time (seconds). (300)
// maxOffTime - Maximum off time (seconds). (1800)
// minOnTime - Minimum on time (seconds). (1800)
// maxOnTime - Maximum off time (seconds). (3600)
// startTime - Time at which triggers should start to fire (hh:mm|sunrise|sunset). (00:00)
// endTime - Time at which triggers should stop firing (hh:mm|sunrise|sunset). (23:59)
// activeTimes - Array of start/end times (see startTime/endTime)
// location - lat/long location to compute sunrise/sunset from ({lat: x, long: y}). ({lat: 0, long: 0})
// offset - Offset information for sunrise/sunset ({sunrise: mins, sunset: mins}). ({sunrise: 0, sunset: 0})
//
// User location can be found with:
//     https://google-developers.appspot.com/maps/documentation/utils/geocoder/
//
////////////////////////////////////////////////////////////////////////////////

const storage = require('node-persist');
const TimeFormat = require('hh-mm-ss');
const SunCalc = require('suncalc');
var padStart = require('string.prototype.padstart');

var Homebridge, Service, Characteristic;

module.exports = function(homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-away-mode", "AwayMode", AwayMode);
}

class AwayMode {

    //
    // Constructor. Create control switch and sensors.
    //
    constructor(log, config) {
        // Shim padStart if it is unavailable (early versions of node)
        if (!String.prototype.padStart) {
            padStart.shim();
        }

        this.log = log;
        this.name = config["name"] || "Away Mode";
        this.sensorNames = config["sensorNames"] || ["Trigger 1"];
        this.sensors = config["sensors"] || [];

        // Time in seconds
        this.minOffTime = config["minOffTime"] || 300;  // 5 min (secs)
        this.maxOffTime = config["maxOffTime"] || 1800; // 30 min (secs)
        this.minOnTime = config["minOnTime"] || 1800;   // 30 min (secs)
        this.maxOnTime = config["maxOnTime"] || 3600;   // 60 min (secs)

        this.startTime = config["startTime"] || "00:00"; // hh:mm|sunrise|sunset
        this.endTime = config["endTime"] || "23:59";     // hh:mm|sunrise|sunset
        this.activeTimes = config["activeTimes"] || [{start:this.startTime, end:this.endTime}];

        // https://google-developers.appspot.com/maps/documentation/utils/geocoder/
        this.location = config["location"] || {lat:0, long:0};
        this.offset = config["offset"] || {sunrise:0, sunset:0}; // 0 min (mins)

        // Multiplier to get to timer values (in milliseconds)
        this.multiplier = 1000;

        this.isSwitchOn = false;

        // Create switch to turn on/off away mode
        this.serviceSwitch = new Service.Switch(this.name);
        this.log("Switch: " + this.name);

        this.serviceSwitch
        .getCharacteristic(Characteristic.On)
        .on('get', function(callback) {
            callback(null, this.isSwitchOn);
        }.bind(this))
        .on('set', this.setOn.bind(this));

        // Check for sensors. If they don't exist, we
        // will create them here. For backwards compatibility.
        if (this.sensors.length === 0) {
            for (let x = 0; x < this.sensorNames.length; x++) {
                this.sensors[x] = {
                    name: this.sensorNames[x]
                }
            }
        }

        // Create motion sensors that will fire randomly
        this.serviceMotions = [];
        this.serviceStates = [];

        for (let x = 1; x <= this.sensors.length; x++) {
            let sensor = this.sensors[x-1];
            sensor.id = x - 1;

            let serviceMotion = new Service.MotionSensor(sensor.name, x);
            this.sensorLog(sensor, "Configuring motion sensor");

            let serviceState = { "motionDetected": false };

            serviceMotion.getCharacteristic(Characteristic.MotionDetected)
            .on('get', function(callback) {
                callback(null, serviceState.motionDetected);
            }.bind(this));

            this.serviceMotions.push(serviceMotion);
            this.serviceStates.push(serviceState);

            // populate sensor defaults if necessary
            sensor.minOffTime = sensor.minOffTime || this.minOffTime;
            sensor.maxOffTime = sensor.maxOffTime || this.maxOffTime;
            sensor.minOnTime = sensor.minOnTime || this.minOnTime;
            sensor.maxOnTime = sensor.maxOnTime || this.maxOnTime;
            sensor.offset = sensor.offset || this.offset;

            // populate active times if necessary
            sensor.activeTimesForSensor = sensor.activeTimesForSensor || this.activeTimes;
            sensor.activeSeconds = new Array(sensor.activeTimesForSensor.length);

            // This call computes side-effects - activeSeconds
            this.computeStartEndTimesForSensor(x-1);
        }

        this.log(`Sensors: ${JSON.stringify(this.sensors)}`);

        // Restore previous state as necessary
        setTimeout(this.restore.bind(this));
    }

    async restore() {
        // initialize local storage
        await storage.init({dir: Homebridge.user.persistPath(), forgiveParseErrors: true});

        // retrieve previous state - main switch
        let active = await storage.getItem('active');

        // main switch previously on
        if (active === 'true') {
            this.log('Restore switch state to on');
            this.serviceSwitch.updateCharacteristic(Characteristic.On, true);
            // set the restore flag on sensors so we check them on first activation
            for (let i=0; i<this.sensors.length; i++) {
                this.sensors[i].restore = true;
            }
            this.setOn(true, undefined);
        }
    }

    //
    // Convert seconds to "hh:mm:ss" for display
    //
    secondsToHourMinSec(timeInSeconds) {
        let r = 0;

        // hours
        let hours = Math.floor(timeInSeconds / 3600);

        // minutes
        r = timeInSeconds % 3600
        let mins = Math.floor(r / 60);

        // seconds
        r = r % 60;

        return '' + hours.toString().padStart(2, '0') + ':' +
               mins.toString().padStart(2, '0') + ':' +
               r.toString().padStart(2, '0');
    }

    sensorLog(sensor, message) {
        this.log(sensor.name+" ("+sensor.id+"): "+message);
    }

    //
    // Compute the seconds from midnight for the given
    // time specification. Time is either 'hh:mm', 'sunrise', or 'sunset'.
    // 'sc' contains sunrise/sunset info. 'offset' only applies to
    // sunrise/sunset calculations.
    //
    computeSecondsFromMidnight(sc, time, offset) {
      let seconds = 0;
      let dynamic = false;

      if (time === 'sunrise' || time === 'sunset') {
          dynamic = true;
          let t = 0; // base time - sunrise or sunset
          let o = 0; // offset from t
          if (time === 'sunrise') {
              t = sc.sunrise;
              o = offset.sunrise * 60; // to seconds
          } else {
              t = sc.sunset;
              o = offset.sunset * 60; // to seconds
          }
          seconds = (t.getHours() * 3600) + (t.getMinutes() * 60) + t.getSeconds() + o;
      } else {
          seconds = TimeFormat.toS(time, 'hh:mm');
      }

      return { seconds: seconds, dynamic: dynamic };
    }

    //
    // Compute start and end times. If dynamic values present (sunrise | sunset),
    // this method will be called at midnight every day.
    //
    // *** Side effects ***
    // Sets the values for sensor.activeSeconds
    //
    computeStartEndTimesForSensor(id) {
        const sensor = this.sensors[id];
        let dynamic = false;

        let times = SunCalc.getTimes(new Date(), this.location.lat, this.location.long);

        // Examine each of the defined ranges
        for (let i=0; i<sensor.activeTimesForSensor.length; i++) {
            let startInfo = this.computeSecondsFromMidnight(times, sensor.activeTimesForSensor[i].start, sensor.offset);
            let endInfo = this.computeSecondsFromMidnight(times, sensor.activeTimesForSensor[i].end, sensor.offset);
            dynamic = dynamic || startInfo.dynamic || endInfo.dynamic;

            sensor.activeSeconds[i] = {start: startInfo.seconds, end: endInfo.seconds};

            this.sensorLog(sensor,
                "Active range " + i + " Start: " + this.secondsToHourMinSec(sensor.activeSeconds[i].start) +
                " End: " + this.secondsToHourMinSec(sensor.activeSeconds[i].end)
            );
        }

        // Set a timer to expire at midnight so we can recalculate the
        // values of sunrise & sunset (if needed)
        if (dynamic) {
            let today = new Date();
            let tommorow = new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
            let timeToMidnight = (tommorow-today)+5000; // +5sec to push it past
            this.sensorLog(sensor, "Recompute in: " + timeToMidnight/1000);
            let timer = setTimeout(function() {
                this.computeStartEndTimesForSensor(id);
            }.bind(this), timeToMidnight);
        }
    }

    //
    // Representation of current time in seconds.
    //
    currentSeconds() {
        let now = new Date();
        return (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    }

    //
    // Return true if the sensor should be turned on. I.e., now falls
    // within the startSeconds / endSeconds range.
    //
    sensorOnTime(sensor) {
        let currentSeconds = this.currentSeconds();

        let turnOn = false;

        // Examine each of the defined ranges
        for (let i=0; i<sensor.activeSeconds.length && turnOn == false; i++) {
            let activeInterval = sensor.activeSeconds[i];

            this.sensorLog(sensor,
                "Active range " + i + " [" + this.secondsToHourMinSec(activeInterval.start) + " - " +
                this.secondsToHourMinSec(activeInterval.end) + "] --> " + this.secondsToHourMinSec(currentSeconds)
            );

            // start / end w/in same day, e.g. 08:00 - 20:00
            if (activeInterval.start <= activeInterval.end) {
                turnOn = (activeInterval.start < currentSeconds) && (currentSeconds < activeInterval.end);
            }

            // start / end span days, e.g. 20:00 - 08:00
            else {
                turnOn = (activeInterval.start < currentSeconds) || (currentSeconds < activeInterval.end);
            }

            // may turn on during this period, evaluate for maximum activiations
            if (turnOn) {
                // active period has changed, start counting activations
                if ((typeof sensor.activePeriod === 'undefined') || (sensor.activePeriod != i)) {
                    sensor.activeTimesForSensor[i].activationCount = 0;
                    sensor.activePeriod = i;
                }

                // same active period, check for maximum activations (if specified),
                // if max activations has been reached, then don't turn it on,
                // but we stay in the same period
                else if (sensor.activeTimesForSensor[i].maxActivations &&
                         sensor.activeTimesForSensor[i].activationCount >= sensor.activeTimesForSensor[i].maxActivations) {
                    this.sensorLog(sensor, `Max activations: ${sensor.activeTimesForSensor[i].maxActivations}`);
                    turnOn = false;
                    break;
                }
            } else {
                delete sensor.activePeriod;
            }
        }

        return turnOn;
    }

    //
    // Turn sensor on after a random amount of off time.
    //
    startOnTimer(id) {
        const serviceMotion = this.serviceMotions[id];
        const serviceState = this.serviceStates[id];
        const sensor = this.sensors[id];

        let time = parseInt(Math.floor(Math.random() * (sensor.maxOffTime - sensor.minOffTime + 1) + sensor.minOffTime));
        let currentSeconds = this.currentSeconds();
        this.sensorLog(sensor, "Starting on timer, delay: " + time +
                 " [" + this.secondsToHourMinSec(currentSeconds + time) + "]");

        serviceState.timeout = setTimeout(function() {
            // Only turn on sensors during allowed times
            if (this.sensorOnTime(sensor)) {
                this.sensorLog(sensor, "Turning motion on");
                this.setSensorOn(id, true);
                sensor.activeTimesForSensor[sensor.activePeriod].activationCount++;
            }

            this.startOffTimer(id);
        }.bind(this), time*this.multiplier);
    }

    //
    // Time (in seconds) until end of active interval. 0 if not in
    // an active interval.
    //
    timeUntilEndOfInterval(sensor) {
        let currentSeconds = this.currentSeconds();
        let time = 0;

        let activeInterval = sensor.activeSeconds[sensor.activePeriod];

        // start / end w/in same day, e.g. 08:00 - 20:00
        if (activeInterval.start <= activeInterval.end) {
            if ((activeInterval.start < currentSeconds) && (currentSeconds < activeInterval.end)) {
                time = activeInterval.end - currentSeconds;
            }
        }

        // start / end span days, e.g. 20:00 - 08:00
        else {
            if ((activeInterval.start < currentSeconds) || (currentSeconds < activeInterval.end)) {
                const secondsPerDay = 86400;

                // before midnight --> seconds remaining in current day + seconds in next day
                if (activeInterval.start < currentSeconds) {
                    time = (secondsPerDay - currentSeconds) + activeInterval.end;
                }

                // after midnight --> seconds remaining in current day
                else {
                    time = activeInterval.end - currentSeconds;
                }
            }
        }

        return time;
    }

    //
    // Compute the off time at which to turn the given sensor off.
    //
    computeOffTime(sensor) {
        let time = parseInt(Math.floor(Math.random() * (sensor.maxOnTime - sensor.minOnTime + 1) + sensor.minOnTime));

        // check for a hard off time and adjust as needed
        if ((typeof sensor.activePeriod !== 'undefined') && sensor.activeTimesForSensor[sensor.activePeriod].absolute) {
            let maxTime = this.timeUntilEndOfInterval(sensor);
            if (time > maxTime) {
                time = maxTime;
            }
        }

        return time;
    }

    //
    // Turn sensor off after a random amount of on time.
    //
    startOffTimer(id) {
        const serviceMotion = this.serviceMotions[id];
        const serviceState = this.serviceStates[id];
        const sensor = this.sensors[id];

        let time = this.computeOffTime(sensor);
        let currentSeconds = this.currentSeconds();
        this.sensorLog(sensor,
            "Starting off timer, delay: " + time + " [" + this.secondsToHourMinSec(currentSeconds + time) + "]"
        );

        serviceState.timeout = setTimeout(function() {
            this.sensorLog(sensor, "Turning motion off");
            this.setSensorOn(id, false);

            this.startOnTimer(id);
        }.bind(this), time*this.multiplier);
    }

    //
    // Initialize the sensor.
    //
    async startSensor(id) {
        let sensor = this.sensors[id];
        this.sensorLog(sensor, "Starting sensor");

        // restore flag set for this sensor - check it - start up only
        if (this.sensors[id].restore) {
            let isOn = await storage.getItem(sensor.name);

            // we only do this once
            delete sensor.restore;

            // On when we quit and still can be on
            if (isOn === 'true' && this.sensorOnTime(sensor)) {
                this.sensorLog(sensor, "Restore sensor to on");

                // restore sensor to motion detected
                this.sensorLog(sensor, "Turning motion on");
                this.setSensorOn(id, true);
                sensor.activeTimesForSensor[sensor.activePeriod].activationCount++;

                // start 'off' timer
                this.startOffTimer(id);
            }

            // On when we quit, but shouldn't be on now
            // Note: We trigger it on first, then turn it off,
            //       otherwise the off won't be sent out because
            //       the homebridge/hap (?) framework thinks it's off.
            else if (isOn === 'true') {
                this.sensorLog(sensor, "Turning motion off");

                // turn it on first
                this.setSensorOn(id, true);

                // then turn it off after delay and start on timer
                setTimeout(function(idx, on) {
                    this.setSensorOn(idx, on);
                    this.startOnTimer(idx);
                }.bind(this), 15000, id, false);
            }

            // Off when we quit - delay before turning on
            else {
                this.startOnTimer(id);
            }
        }

        // standard start for sensor - delay before turning on
        else {
            this.startOnTimer(id);
        }
    }

    //
    // Shut down the sensor. Clear timeouts. Turn if off.
    //
    stopSensor(id) {
        let sensor = this.sensors[id];

        this.sensorLog(sensor, "Stopping sensor");

        const serviceState = this.serviceStates[id];
        const motionDetected = serviceState.motionDetected;
        const timeout = serviceState.timeout;

        // Timeout currently set, cancel
        if (timeout) {
            this.sensorLog(sensor, "Stopping timer");
            clearTimeout(timeout);
            delete serviceState.timeout;
        }

        // Sensor is currently on, turn it off
        if (motionDetected) {
            this.sensorLog(sensor, "Turning motion off");
            this.setSensorOn(id, false);
        }

        // Reset the active period
        if (typeof sensor.activePeriod !== 'undefined') {
            delete sensor.activePeriod;
        }
    }

    //
    // Activate or deactivate a sensor.
    //
    async setSensorOn(id, on) {
        this.serviceMotions[id].updateCharacteristic(Characteristic.MotionDetected, on);
        this.serviceStates[id].motionDetected = on;
        await storage.setItem(this.sensors[id].name, on ? 'true' : 'false');
    }

    //
    // Turn switch on or off.
    //
    async setOn(on, callback) {

        // Store the new state
        await storage.setItem('active', on ? 'true' : 'false');

        // Turn away mode on, currently off
        if (on && !this.isSwitchOn) {
            this.log("Switch turned on");

            //Turn on the switch
            this.isSwitchOn = true;

            // Turn on the sensors
            for (let x = 0; x < this.sensors.length; x++) {
                this.startSensor(x);
            }
        }

        // Turn away mode off, currently on
        else if (!on && this.isSwitchOn) {
            this.log("Switch turned off");

            // Turn off the switch
            this.isSwitchOn = false;

            // Turn off the sensors
            for (let x = 0; x < this.sensors.length; x++) {
                this.stopSensor(x);
            }
        }

        callback && callback();
    }

    //
    // Share services that have been created.
    //
    getServices() {
        return [this.serviceSwitch, ...this.serviceMotions];
    }
}
