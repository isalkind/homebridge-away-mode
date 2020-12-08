# homebridge-away-mode

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![mit license](https://badgen.net/badge/license/MIT/red)](https://github.com/isalkind/homebridge-away-mode/blob/master/LICENSE)
[![npm](https://badgen.net/npm/dt/homebridge-away-mode)](https://www.npmjs.com/package/homebridge-away-mode)

[Homebridge](https://homebridge.io) plugin that provides triggers to turn on and turn off lights to simulate occupancy. We provide the triggers, you provide the lights.

A simulated switch is created that controls whether "away mode" is active. When the switch is on, away mode is active. When the switch is off, away mode is inactive. A set of simulated sensors detect "activity". When activity (motion) is detected, turn the light on. When activity (motion) is not detected, turn the light off. The behavior of each sensor is random: a sensor is off for a period of time, turns on for a period of time, then repeats. When the switch is turned on, the sensors are activated to start their off/on behavior. When the switch is turned off, the sensors are deactivated and turned off.

## Homebridge Restart

The plugin attempts to restore itself to the its previous state if a restart occurs and the "away mode" switch is on:
1. The "away mode" switch is turned on.
1. For any sensor that was previously on:
    1. If the sensor is still allowed to be on, it is turned on and the normal on/off sequence is resumed, starting from on.
    1. If the sensor is not allowed to turn on, it is not turned on and the normal on/off sequence is resumed, starting from off.
1. Any sensor that was previously off will begin its on/off sequence, starting from off.

_**Caveat** - Because the plugin does not track how long a sensor had been on (or off) when a restart occurred, it is possible that the sensor will be on (or off) longer than the settings would normally allow. This will only effect the first sequence following the restart._

# Installation

npm -g install homebridge-away-mode

# Configuration

It is highly recommended to use the [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x) plugin for ease of configuration. The `homebridge-away-mode` plugin's behavior is driven almost entirely by the values you specify in the configuration. Depending on how many sensors you configure and how complex you make each sensor's behavior, the configuration can become quite extensive.

### Simple configuration example
config.json:
```
"accessories": [
    {
        "accessory": "AwayMode",
        "name": "Away Mode",
        "sensors": [
            {
                "name": "Trigger1"
            },
            {
                "name": "Trigger2"
            }
        ],
        "minOffTime": 300,
        "maxOffTime": 1800,
        "minOnTime": 1800,
        "maxOnTime": 3600
    }
]
```
The above example creates a switch called 'Away Mode' and two sensors: 'Trigger 1' and 'Trigger 2'. A sensor will remain off for 300 to 1800 seconds (5 minutes to 1/2 hour). A sensor will remain on for 1800 to 3600 seconds (1/2 hour to 1 hour). Sensors will only be active when the 'Away Mode' switch is turned on.

In this example, you use your automation software to turn the 'Away Mode' switch on when you want the sensors to be active (turn on & off), and off when you don't want them to be active.
##### HomeKit
In Home (or any of the HomeKit compatible apps), you will see three new devices exposed:
* 1 switch named 'Away Mode'
* 2 motion sensors named 'Trigger 1' and 'Trigger 2'

Automate the switch to turn on and off at specific times. For example:
* 15 minutes before sunset (daily), turn the switch on
* At 10:00pm (daily), turn the switch off

Automate the motions sensors. For Example:
* When motion is detected ('Trigger 1'), turn 'Lamp 1' on
* When no motion is detected ('Trigger 1'), turn 'Lamp 1' off

This setup makes sense when you know you will be away from your house for an extended period of time. You enable the switch automation before you leave and disable it when you return.

### Advanced configuration example
config.json:
```
"accessories": [
    {
        "accessory": "AwayMode",
        "name": "Away Mode",
        "sensors": [
            {
                "name": "Trigger1"
            },
            {
                "name": "Trigger2"
            }
        ],
        "minOffTime": 300,
        "maxOffTime": 1800,
        "minOnTime": 1800,
        "maxOnTime": 3600,
        "activeTimes": [
            {
                "start": "sunset",
                "end": "22:00"
            }
        ],
        "location": {
            "lat": 40.689510,
            "long": -74.044500
        },
        "offset": {
            "sunrise": 0,
            "sunset": -15
        }
    }
]
```
The above example creates a switch called 'Away Mode' and two sensors: 'Trigger 1' and 'Trigger 2'. A sensor will remain off for 300 to 1800 seconds (5 minutes to 1/2 hour). A sensor will remain on for 1800 to 3600 seconds (1/2 hour to 1 hour). Sensors will only be active when the 'Away Mode' switch is turned on. Sensors will only turn on from 15 minutes before sunset to 10:00pm. The location information is used to compute the values for sunrise/sunset (as needed).

In this example, you might use your automation software to detect when your residence is not occupied and turn on the 'Away Mode' and turn if off when the residence is occupied. However, you only want the sensors turning on and off during a specific period of the day.

**Note**: This can *mostly* be accomplished using HomeKit and the simple configuration. However, HomeKit does not allow you to mix specific times (eg., 10:00pm) with sunrise/sunset times.

##### HomeKit
In Home (or any of the HomeKit compatible apps), you will see three new devices exposed:
* 1 switch named 'Away Mode'
* 2 motion sensors named 'Trigger 1' and 'Trigger 2'

Automate the switch to turn on and off based on specific conditions. For example:
* When the last person leaves home, turn the switch on
* When the first person arrives home, turn the switch off

Automate the motions sensors. For Example:
* When motion is detected ('Trigger 1'), turn 'Lamp 1' on
* When no motion is detected ('Trigger 1'), turn 'Lamp 1' off

This setup makes sense when you want to make sure the automation always runs when you are not home, but only want the sensors to trigger during specific times of the day.

### Parameters

| Param         | Description   | Default  |
| ------------- | ------------- | -------- |
| accessory | **Must be set to "AwayMode"**
| name | The name of the switch | "Away Mode" |
| sensorNames | Array of names for each sensor to be created<br><br>**DEPRECATED** - See 'sensors' parameter. If the 'sensors' parameter is specified, this will be ignored. | ["Trigger 1"] |
| sensors | Array of per-sensor information.<br><br>Each sensor object **MUST** contain 'name' and **MAY** contain 'minOffTime', 'maxOffTime', 'minOnTime', 'maxOnTime', 'activeTimesForSensor'. These *time* parameters override the globally defined *time* parameters if specified.<br><br>Example 1: [{"name": "Trigger1"}]<br>Set sensor name, use the global time parameters.<br><br>Example 2: [{"name": "Trigger1", "minOffTime": 27}]<br>Set sensor name, override the 'minOffTime' global time parameter.<br><br>Example 3: [{"name": "Trigger1", "activeTimesForSensor":[{"start": "sunset", "end": "23:00"}]}]<br>Set sensor name, override the 'activeTimes' global time parameter.<br><br>See global time parameters: 'minOffTime', 'minOffTime', 'minOnTime', 'maxOffTime', 'activeTimes'<br><br>**Note:** The 'activeTimesForSensor' parameter maps to the global 'activeTimes' parameter.<br><br>**Note:** If the 'sensors' parameter is specified, the 'sensorNames' parameter will be ignored. | [{"name": "Trigger1"}] |
| minOffTime | Minimum off time (secs) | 300 |
| maxOffTime | Maximum off time (secs) | 1800 |
| minOnTime | Minimum on time (secs) | 1800 |
| maxOnTime | Maximum on time (secs) | 3600 |
| startTime | Time at which triggers should start to fire<br>("hh:mm"\|"sunrise"\|"sunset")<br><br>**DEPRECATED** - See 'activeTimes' parameter. If the 'activeTimes' parameter is specified, this will be ignored. | "00:00" |
| endTime | Time at which triggers should stop firing<br>("hh:mm"\|"sunrise"\|"sunset")<br><br>**DEPRECATED** - See 'activeTimes' parameter. If the 'activeTimes' parameter is specified, this will be ignored. | "23:59" |
| activeTimes | Array of start/end times for periods when triggers should fire.<br>Set start/end times as: ("hh:mm"\|"sunrise"\|"sunset")<br><br>You may also include the optional "absolute" parameter as: (true\|false). When set to true, sensors will turn off immediately when the end time is reached (if one is on).<br><br>Example 1: [{"start": "sunset", "end": "22:00"}]<br><br>Example 2: [{"start": "sunset", "end": "22:00", "absolute": true}]| [{"start": "00:00", "end": "23:59"}] |
| location | Lat/long location to compute sunrise/sunset from. Use in conjunction with "startTime"\|"endTime" when they are set to "sunrise"\|"sunset".<br>({"lat": x, "long": y}) <br><br>Find your location: [Google Maps location finder](https://google-developers.appspot.com/maps/documentation/utils/geocoder/) | {"lat": 0, "long": 0} |
| offset | Offset information for sunrise/sunset. Offset is in minutes. May be negative (before) or positive (after). Use in conjunction with "startTime"\|"endTime" when they are set to "sunrise"\|"sunset".<br>({"sunrise": mins, "sunset": mins}) | {"sunrise": 0, "sunset": 0} |

Parameters in the table above are optional, except 'accessory' which must be set to 'AwayMode', and need not be specified if you are happy with the default value.

Time examples:

| startTime | endTime | Offset |Description |
| --------- | ------- | ------ | ----------- |
| "08:00" | "20:00" | NA | Span the hours from 8am to 8pm |
| "20:00" | "08:00" | NA | Span the hours from 8pm to 8am |
| "sunset" | "22:00" | {"sunset":-15} | Span the hours from 15 minutes before sunset to 10pm. Sunset is computed based on the location you provide. |
| "23:00" | "sunrise" | {"sunrise":30} | Span the hours from 11pm to 30 minutes after sunrise. Sunrise is computed based on the location you provide. |
| "sunrise" | "sunset" | {"sunrise":-15, "sunset":15} | Span the hours from 15 minutes before sunrise to 15 minutes after sunset. Sunrise and sunset are computed based on the location you provide. |
