
# Change Log

All notable changes to this project will be documented in this file.

## 1.5.0 (2020-05-11)

### Notable Changes

* Allow specification of active times on a per-sensor basis. See the new 'activeTimesForSensor' configuration parameter that is part of the 'sensors' configuration. Values specified by 'activeTimesForSensor' will override the global values in the 'activeTimes' configuration parameter.

* The active times configuration now allows an optional parameter to be added to each active period to force any sensors to turn off when the end of the active period is reached. The default behavior allows the sensor to remain on until it naturally turns off. See the 'activeTimes' configuration parameter and optional 'absolute' element. This optional configuration is also available on the per-sensor override parameter 'activeTimesForSensor'. ([#7](https://github.com/isalkind/homebridge-away-mode/issues/7))

## 1.4.2 (2020-01-12)

### Notable Changes

* Updated CHANGELOG. Forgot to do it on 1.4.1.

## 1.4.1 (2020-01-12)

### Bug Fixes

* Shim padStart for String on early versions of node. ([#5](https://github.com/isalkind/homebridge-away-mode/issues/5))

## 1.4.0 (2020-01-06)

### Notable Changes

* Adopt the config.schema.json used by [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) to perform web-based configuration for this plugin.

### Other Changes

* Add **Change Log**

## 1.3.0 (2019-12-15)

### Notable Changes

* Configure the min/max on and off times on a per-sensor basis. See the new 'sensors' configuration parameter. ([#4](https://github.com/isalkind/homebridge-away-mode/issues/4))

## 1.2.0 (2019-12-02)

### Notable Changes

* Specify multiple time ranges for triggers to activate. See 'activeTimes' configuration parameter. ([#2](https://github.com/isalkind/homebridge-away-mode/issues/2))

## 1.1.0 (2019-02-23)

### Notable Changes

* Specify a time range for triggers to be active. See 'startTime' and 'endTime' configuration parameters.
* Specify location to compute 'sunrise' and 'sunset' values from. See 'location' configuration parameter.
* Specify offset information for 'sunrise' and 'sunset'. See 'offset' configuration parameter.

### Other Changes

* Updated npm dependencies

## 1.0.0 (2018-01-30)

### Initial Release
