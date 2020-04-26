"use strict";
var Service, Characteristic;
var rpio = require('rpio');


module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-gpio-electic-rim-lock', 'Tiro', GPIOLockAccessory);	
}

function getSerial(){
	var fs = require('fs');
	var content = fs.readFileSync('/proc/cpuinfo', 'utf8').split("\n");	
	var serial = content[content.length-2].split(":");
	return serial[1].slice(9);
}

function GPIOLockAccessory(log, config) {
	this.version = require('./package.json').version;
	this.log = log;

	this.name = config['name'];
	
	//GPIO Pin at RPI Header 
	this.pin = config['pin'];

	//Autolock 
	this.autoLock = config.autoLock || false
	this.autoLockDelay = config.autoLockDelay || 3000

	//lockstate Variables
	this.currentLockState = Characteristic.LockCurrentState.SECURED;
	this.targetLockState = Characteristic.LockTargetState.SECURED;


	if (!this.pin) throw new Error("You must provide a config value for pin.");
	if (this.autoLock && this.autoLockDelay % 1 == 0) {
		this.log("autolooking enabled after %s milliseconds",this.autoLockDelay);
	} 
	this.log("Tiro GPIO version: " + this.version);
	this.log("Switch pin: " + this.pin);

		//TODO: adapt Informationservice
		this.informationService = new Service.AccessoryInformation();
		this.informationService
    		.setCharacteristic(Characteristic.Manufacturer, "sth")
			.setCharacteristic(Characteristic.Model, "GPIO Lock")
			.setCharacteristic(Characteristic.SerialNumber, getSerial() + this.pin)
			.setCharacteristic(Characteristic.FirmwareRevision, this.version);

		// LockMechanism
		this.lockMechanismService = new Service.LockMechanism(this.name);
		this.lockMechanismService
    		.getCharacteristic(Characteristic.LockCurrentState)
			.on('get', this.getLockCurrentState.bind(this));

		this.lockMechanismService
    		.getCharacteristic(Characteristic.LockTargetState)
    		.on('get', this.getLockTargetState.bind(this))
    		.on('set', this.setLockTargetState.bind(this));

		this.lockMechanismService.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
		this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);

		this.log("init complete");
}

GPIOLockAccessory.prototype = {
  
	getServices: function() {	
		return [this.informationService, this.lockMechanismService];
	},

	getLockCurrentState: function(callback) {
		this.log("getLockCurrentState " + this.currentLockState);
		callback(null, this.currentLockState);
	},

	getLockTargetState: function(callback) {
		this.log("getLockTargetState " + this.targetLockState);
		callback(null, this.targetLockState);
	},

	
	setLockTargetState: function(state, callback) {
		switch (state) {
			case Characteristic.LockTargetState.SECURED:
				this.log("set to Characteristic.LockTargetState.SECURED");
				this.setLocked();
				this.targetLockState = state;
				break;
			case Characteristic.LockCurrentState.UNSECURED:
				this.log("set to Characteristic.LockTargetState.UNSECURED");
				this.setUnLocked();
				this.targetLockState = state;
				if (this.autoLock){
					this.log('Waiting %s milliseconds for autolock', this.autoLockDelay);
					this.autoLockFunction()
				}
				break;
			default:
				this.log("default")
		}
	callback(null);
	},

	setLocked: function() {
		this.log("lock ") + this.name;
		this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
		this.currentLockState = Characteristic.LockTargetState.SECURED;
		this.writePin(0);
	},

	setUnLocked: function() {
		this.log("unlock ") + this.name;
		this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.UNSECURED);
		this.currentLockState = Characteristic.LockTargetState.UNSECURED;
		this.writePin(1);
	},

	autoLockFunction: function () {
		this.log('Waiting %s seconds for autolock', this.autoLockDelay)
		setTimeout(() => {
			this.log('Autolocking...');
			this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
			this.setLocked();
		}, this.autoLockDelay)
	  },

	writePin: function(val) {	
		this.log("Turning " + (val == 0 ? "off" : "on") + " pin " + this.pin);
		this.lockMechanismService.updateCharacteristic(Characteristic.LockCurrentState,
			val == 0 ?
			Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
		rpio.open(this.pin, rpio.OUTPUT);
		rpio.write(this.pin, val);
	}
}
