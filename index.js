let Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("switch-plugin", "MyAwesomeSwitch", mySwitch);
};

const request = require('request');
const url = require('url');

function mySwitch(log, config) {
  this.log = log;
  this.name = config['name'];
  this.url = url.parse(config['url']);
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
  return [informationService, switchService];
}

mySwitch.prototype.getSwitchOnCharacteristic = function (next) {
  const me = this;
  request(me.url, function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
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
        if (response !== undefined) {
          me.log('STATUS: ' + response.statusCode);
        }
        me.log(error.message);
        return next(error);
      }
      return next();
    }
  );
}
