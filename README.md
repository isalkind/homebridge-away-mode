# homebridge-away-mode

Homebridge plugin that provides triggers to turn on and turn off lights to simulate occupancy. We provide the triggers, you provide the lights.

A simulated switch is created that controls whether "away mode" is active. When the switch is on, away mode is active. When the switch is off, away mode is inactive. A set of simulated sensors detect "activity". When activity (motion) is detected, turn the light on. When activity (motion) is not detected, turn the light off. The behavior of each sensor is random: a sensor is off for a period of time, turns on for a period of time, then repeats. When the switch is turned on, the sensors are activiated to start their off/on behavior. When the switch is turned off, the sensors are deactived and turned off.

# Installation

npm -g install homebridge-away-mode

# Configuration

Example config.json:

```
"accessories": [
    {
        "accessory": "AwayMode",
        "name": "Away Mode",
        "sensorNames": ["Trigger 1", "Trigger 2"],
        "minOffTime": 300,
        "maxOffTime": 1800,
        "minOnTime": 1800,
        "maxOnTime": 3600
    }
]
```

Parameters - (defaults in parenthesis)

* name - The name of the switch. ("Away Mode")
* sensorNames - Array of names for each sensor to be created. (["Trigger 1"])
* minOffTime - Minimum off time (seconds). (300)
* maxOffTime - Maximum off time (seconds). (1800)
* minOnTime - Minimum on time (seconds). (1800)
* maxOnTime - Maximum off time (seconds). (3600)

