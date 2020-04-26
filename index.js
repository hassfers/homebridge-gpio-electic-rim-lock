"use strict";
var Service, Characteristic;
// var rpio = require('rpio');


module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-gpio-electic-rim-lock', 'Tiro', ElecticRimLockAccessory);	
}

function getSerial(){
	var fs = require('fs');
	var content = fs.readFileSync('/proc/cpuinfo', 'utf8').split("\n");	
	var serial = content[content.length-2].split(":");
	return serial[1].slice(9);
}


function ElecticRimLockAccessory(log, config) {
	this.version = require('./package.json').version;
	this.log = log;

	this.name = config['name'];
	
	//GPIO Pin at RPI Header 
	this.pin = config['pin'];

	//Autolock 
	this.autoLock = config.autoLock || false
	this.autoLockDelay = config.autoLockDelay || 10

	//lockstate Variables
	this.currentLockState = Characteristic.LockCurrentState.SECURED;
	this.targetLockState = Characteristic.LockTargetState.SECURED;


	if (!this.pin) throw new Error("You must provide a config value for pin.");
	if (this.duration == null || this.duration % 1 != 0) this.duration = 3000;
	this.log("Tiro GPIO version: " + this.version);
	this.log("Switch pin: " + this.pin);
	this.log("Active time: " + this.duration + " ms");

	//Instatiate the services
	let informationService = new Service.AccessoryInformation();
	let lockMechanismService = new Service.LockMechanism(this.name);
}

ElecticRimLockAccessory.prototype = {
  
	getServices: function() {	

		//TODO: adapt Informationservice
	
		this.informationService
    		.setCharacteristic(Characteristic.Manufacturer, "sth")
			.setCharacteristic(Characteristic.Model, "GPIO Lock")
			.setCharacteristic(Characteristic.SerialNumber, getSerial() + this.pin)
			.setCharacteristic(Characteristic.FirmwareRevision, this.version);

		// LockMechanism
		this.lockMechanismService
    			.getCharacteristic(Characteristic.LockCurrentState)
					.on('get', this.getLockCurrentState.bind(this));	
						
		this.lockMechanismService
    			.getCharacteristic(Characteristic.LockTargetState)
    				.on('get', this.getLockTargetState.bind(this))
    				.on('set', this.setLockTargetState.bind(this));

		this.lockMechanismService
			updateCharacteristic(Characteristic.LockCurrentState, 
			Characteristic.LockTargetState.SECURED);

		this.lockMechanismService.
			updateCharacteristic(Characteristic.LockTargetState, 
			Characteristic.LockTargetState.SECURED);

		return [informationService, lockMechanismService];
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
		this.log("getLockTargetState" + this.currentLockState + state);
		// if ( state == this.currentLockState) {
		// 	this.log("early return")
		// 	return("was da los")
		// }
		switch (state) {
			case Characteristic.LockTargetState.SECURED:
				this.log("set to Characteristic.LockTargetState.SECURED");
				this.setLocked();
				// if (this.duration){
				// 	this.autoLockFunction();
				// }
				this.targetLockState = state;
				callback(null);
			case Characteristic.LockCurrentState.UNSECURED:
				this.log("set to Characteristic.LockTargetState.UNSECURED");
				this.setUnLocked();
				this.targetLockState = state;
				callback(null)
			default:
				this.log("default")
				callback(null);
				return
		}
		// if (state == 0) {
		// 	this.writePin(1);
		// 	this.log("Wait for " + this.duration + " ms");
		// 	var self = this;
		// 	setTimeout(function(){self.writePin(0)}, this.duration);
		// 	this.log("Set state to open");
		// 	this.lastLockTargetState = 0;
		// 	callback(null);
		// } else {
		// 	this.writePin(0);
		// 	this.log("Set state to closed");
		// 	this.lastLockTargetState = 1;
		// 	callback(null);
		// }	
		
		// if (state == )


	},

	setLocked: function() {
		this.log("lock ") + this.name;
		this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, 
		Characteristic.LockTargetState.SECURED);
		this.writePin(0);
	},

	setUnLocked: function() {
		this.log("unlock ") + this.name;
		this.lockMechanismService.updateCharacteristic(Characteristic.LockTargetState, 
			Characteristic.LockTargetState.UNSECURED);
		this.writePin(1);
	},

	autoLockFunction: function () {
		this.log('Waiting %s seconds for autolock', this.duration)
		setTimeout(() => {
		//   this.lockMechanismService.setCharacteristic(Characteristic.LockTargetState, 1)
		this.setLocked();
		  this.log('Autolocking...')
		}, this.duration)
	  },

	writePin: function(val) {	
		this.log("Turning " + (val == 0 ? "off" : "on") + " pin " + this.pin);
		this.lockMechanismService.updateCharacteristic(Characteristic.currentLockState, 
			val == Characteristic.LockTargetState.SECURED ? 
			Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED);
		// rpio.open(this.pin, rpio.OUTPUT);
		// rpio.write(this.pin, val);
	}
}
