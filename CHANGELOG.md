
# Change Log

All notable changes to this project will be documented in this file.

## 1.6.7 (2025-06-30)

* Checked, tested, and marked compatible for Homebridge v2.0. Updated `package.json`. No code/functionality changes.

## 1.6.6 (2023-12-20)

### Notable Changes

* Add ability to limit the number of sensors that are on at one time. See the new global configuration parameter `maxOnSensors`.
* Update configuration schema for config-ui-x support of new parameter. Can be found in the `Global Settings / Miscellaneous` section.
* Update README for new parameter.
* Update dependencies

## 1.6.5 (2023-04-27)

### Notable Changes

* Update to reduce verbosity of logging. See the *Logging* section in the [README](https://github.com/isalkind/homebridge-away-mode#logging). Thanks @[PuzzledUser](https://github.com/PuzzledUser)! ([#24](https://github.com/isalkind/homebridge-away-mode/issues/24))

## 1.6.4 (2023-01-08)

### Notable Changes

* Add ConfiguredName characteristic to motion sensors to ensure that configured value is used when the sensor is exposed to HomeKit. Resolution for Issues ([#16](https://github.com/isalkind/homebridge-away-mode/issues/16)) and ([#20](https://github.com/isalkind/homebridge-away-mode/issues/20)).

## 1.6.3 (2023-01-06)

### Notable Changes

* Consistently log sensor name and id to make logs easier to navigate. Thanks @[primdahl](https://github.com/primdahl)! ([#18](https://github.com/isalkind/homebridge-away-mode/pull/18))

### Other Changes

* Update the coordinate helper link in code comment

## 1.6.2 (2022-12-19)

### Notable Changes

* Update dependencies

### Other Changes

* Update the coordinate helper links

* Add note in README about HomeKit changes that result in configured sensor names being ignored

## 1.6.1 (2021-07-20)

### Notable Changes

* Allow user to specify sunrise/sunset offsets on a per-sensor basis. See configuration of 'offset'. ([#12](https://github.com/isalkind/homebridge-away-mode/issues/12))

## 1.6.0 (2021-03-17)

### Notable Changes

* Allow user to specify maximum number of activations for a sensor for each active period. May be specified globally or per-sensor. See configuration of 'Active Periods'. ([#10](https://github.com/isalkind/homebridge-away-mode/issues/10))

## 1.5.2 (2020-12-08)

### Notable Changes

* Restore sensors to their previous state after restart if homebridge was restarted while the 'Away Mode' switch was on.

## 1.5.1 (2020-11-28)

### Notable Changes

* Maintain switch state across restarts. If the homebridge is restarted while the 'Away Mode' switch is on, activities will be resumed after the restart. ([#8](https://github.com/isalkind/homebridge-away-mode/issues/8))

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
