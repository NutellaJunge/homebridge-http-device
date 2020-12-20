let Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("switch-plugin", "MyAwesomeSwitch", mySwitch);
};

const request = require('request');

function mySwitch(log, config) {
  this.log = log;
  this.name = config['name'];
  this.url = config['url'];
}

mySwitch.prototype.getServices = function () {
  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
    .setCharacteristic(Characteristic.Model, "My switch model")
    .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

  this.switchService = new Service.Switch(this.name);
  this.switchService
    .getCharacteristic(Characteristic.On)
    .on('get', this.getSwitchOnCharacteristic.bind(this))
    .on('set', this.setSwitchOnCharacteristic.bind(this));
  
  setInterval(function () {
    this.updateState();
  }.bind(this), 1000);
  
  return [this.informationService, this.switchService];
}

mySwitch.prototype.updateState = function () {
  const me = this;
  me.log(this.switchService);
  request(me.url, function (error, response, body) {
    if (error) {
      me.log('ERROR: ' + error);
      me.log('STATUS: ' + response && response.statusCode);
      return;
    }
    me.switchService.setCharacteristic(Characteristic.On, body);
    return;
  });
}

mySwitch.prototype.getSwitchOnCharacteristic = function (next) {
  const me = this;
  request(me.url, function (error, response, body) {
    if (error) {
      me.log('ERROR: ' + error);
      me.log('STATUS: ' + response && response.statusCode);
      return next(error);
    }
    return next(null, body);
  });
}

mySwitch.prototype.setSwitchOnCharacteristic = function (on, next) {
  const me = this;
  request.post(
    {
      url: me.url,
      form: {targetState: on}
    },
    function (error, response, body) {
      if (error) {
        me.log('ERROR: ' + error);
        me.log('STATUS: ' + response && response.statusCode);
        return next(error);
      }
      return next();
    }
  );
}
