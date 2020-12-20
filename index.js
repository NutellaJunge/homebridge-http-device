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
  let informationService = new Service.AccessoryInformation();
  informationService
    .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
    .setCharacteristic(Characteristic.Model, "My switch model")
    .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

  let switchService = new Service.Switch(this.name);
  switchService
    .getCharacteristic(Characteristic.On)
    .on('get', this.getSwitchOnCharacteristic.bind(this))
    .on('set', this.setSwitchOnCharacteristic.bind(this));

  this.informationService = informationService;
  this.switchService = switchService;
  
  setInterval(function () {
    this.updateState();
  }.bind(this), 1000);
  
  return [informationService, switchService];
}

mySwitch.prototype.updateState = function () {
  const me = this;
  request(me.url, function (error, response, body) {
    if (error) {
      me.log('ERROR: ' + error);
      me.log('STATUS: ' + response && response.statusCode);
      return;
    }
    this.switchService.setCharacteristic(Characteristic.On, body);
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
