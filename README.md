# homebridge-gpio-electic-rim-lock
Homebridge plugin to open electric locks via Raspberry Pi GPIO pins.

## Circuit

This plugin assumes that you are using a Raspberry Pi to directly control your electric rim locks. Electric rim locks usually have a switch on the wall that you can push to open the door. In order for this to be an effective electric rim locks opener, you need a relay that will perform the duty of the button.


## First of all 
```
pip install RPIO

npm i rpio
```

## Installation

Install this plugin using: 
```
git clone ...
npm install ./homebridge-gpio-electic-rim-lock
```


## Configuration

You will need to add the following accessory configuration to the Homebridge [config.json](https://github.com/nfarina/homebridge/blob/master/config-sample.json).

Configuration sample:

```JSON
    "accessories": [
     {
               "accessory": "GPIO-Lock",
               "name": "Door",
               "pin": 12,
               "autoLock": true,
               "autoLockDelay": 2000
          }
    ]
```

Fields: 

* name - Can be anything (required).
* pin - The physical GPIO pin number that controls the relay (required).
* autoLock - enable autolook
* autoLockDelay - Number of milliseconds to trigger the relay. Defaults to 3000 millseconds (3 seconds) if not specified.
