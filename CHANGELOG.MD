
# Change Log

All notable changes to this project will be documented in this file.

## 1.4.1 (2020-01-12)

### Bug Fixes

* Shim padStart for String on early versions of node.

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
