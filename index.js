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
// minOffTime - Minimum off time (seconds). (300)
// maxOffTime - Maximum off time (seconds). (1800)
// minOnTime - Minimum on time (seconds). (1800)
// maxOnTime - Maximum off time (seconds). (3600)
//
////////////////////////////////////////////////////////////////////////////////

var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-away-mode", "AwayMode", AwayMode);
}

class AwayMode {

    //
    // Constructor. Create control switch and sensors.
    //
    constructor(log, config) {
        this.log = log;
        this.name = config["name"] || "Away Mode";
        this.sensorNames = config["sensorNames"] || ["Trigger 1"];

        // Time in seconds
        this.minOffTime = config["minOffTime"] || 300;  // 5 min
        this.maxOffTime = config["maxOffTime"] || 1800; // 30 min
        this.minOnTime = config["minOnTime"] || 1800;   // 30 min
        this.maxOnTime = config["maxOnTime"] || 3600;   // 60 min

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

        // Create motion sensors that will fire randomly
        this.serviceMotions = [];
        this.serviceStates = [];

        for (let x = 1; x <= this.sensorNames.length; x++) {
            let sensorName = this.sensorNames[x-1];
            let serviceMotion = new Service.MotionSensor(sensorName, x);
            this.log("MotionSensor: " + sensorName);

            let serviceState = { "motionDetected": false };

            serviceMotion.getCharacteristic(Characteristic.MotionDetected)
            .on('get', function(callback) {
                callback(null, serviceState.motionDetected);
            }.bind(this));

            this.serviceMotions.push(serviceMotion);
            this.serviceStates.push(serviceState);
        }
    }

    //
    // Turn sensor on after a random amount of off time.
    //
    startOnTimer(id) {
        const sensor = this.serviceMotions[id];
        const serviceState = this.serviceStates[id];

        let time = parseInt(Math.floor(Math.random() * (this.maxOffTime - this.minOffTime + 1) + this.minOffTime));
        this.log("Starting on timer for sensor: " + id + ", delay: " + time);

        serviceState.timeout = setTimeout(function() {
            this.log("Turning motion on for sensor: " + id);
            sensor.setCharacteristic(Characteristic.MotionDetected, true);
            serviceState.motionDetected = true;

            this.startOffTimer(id);
        }.bind(this), time*this.multiplier);
    }

    //
    // Turn sensor off after a random amount of on time.
    //
    startOffTimer(id) {
        const sensor = this.serviceMotions[id];
        const serviceState = this.serviceStates[id];

        let time = parseInt(Math.floor(Math.random() * (this.maxOnTime - this.minOnTime + 1) + this.minOnTime));
        this.log("Starting off timer for sensor: " + id + ", delay: " + time);

        serviceState.timeout = setTimeout(function() {
            this.log("Turning motion off for sensor: " + id);
            sensor.setCharacteristic(Characteristic.MotionDetected, false);
            serviceState.motionDetected = false;

            this.startOnTimer(id);
        }.bind(this), time*this.multiplier);
    }

    //
    // Initialize the sensor.
    //
    startSensor(id) {
        this.log("Starting sensor: " + id);

        this.startOnTimer(id);
    }

    //
    // Shut down the sensor. Clear timeouts. Turn if off.
    //
    stopSensor(id) {
        this.log("Stopping sensor: " + id);

        const sensor = this.serviceMotions[id];
        const serviceState = this.serviceStates[id];
        const motionDetected = serviceState.motionDetected;
        const timeout = serviceState.timeout;

        // Timeout currently set, cancel
        if (timeout) {
            this.log("Stopping timer for sensor: " + id);
            clearTimeout(timeout);
            delete serviceState.timeout;
        }

        // Sensor is currently on, turn it off
        if (motionDetected) {
            this.log("Turning motion off for sensor: " + id);
            sensor.setCharacteristic(Characteristic.MotionDetected, false);
            serviceState.motionDetected = false;
        }
    }

    //
    // Turn switch on or off.
    //
    setOn(on, callback) {

        // Turn away mode on, currently off
        if (on && !this.isSwitchOn) {
            this.log("Switch turned on");

            //Turn on the switch
            this.isSwitchOn = true;

            // Turn on the sensors
            for (let x = 0; x < this.sensorNames.length; x++) {
                this.startSensor(x);
            }
        }

        // Turn away mode off, currently on
        else if (!on && this.isSwitchOn) {
            this.log("Switch turned off");

            // Turn off the switch
            this.isSwitchOn = false;

            // Turn off the sensors
            for (let x = 0; x < this.sensorNames.length; x++) {
                this.stopSensor(x);
            }
        }

        callback();
    }

    //
    // Share services that have been created.
    //
    getServices() {
        return [this.serviceSwitch, ...this.serviceMotions];
    }
}
