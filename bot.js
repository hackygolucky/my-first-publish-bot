'use strict'

require('dotenv').config()

var createMonitor = require('micro-monitor');
var procMetrics = require('numbat-process');
var Emitter = require('numbat-emitter');
var bole = require('bole');
var Twit = require('twit');
var congrats = require('./congrats');

var settings = require('./settings');

createMonitor(settings.monitor_port);
var logger = bole('bot');
bole.output({
  level: 'info',
  stream: process.stdout
});

var T = new Twit({
  access_token_secret: settings.access_token_secret,
  access_token: settings.access_token,
  consumer_secret: settings.consumer_secret,
  consumer_key: settings.consumer_key
});
var stream = T.stream('user');

var myFirstPublishSearch = {q: "#myfirstpublish", count: 10, result_type: "recent"}; 

var metrics = new Emitter({
  app: settings.name,
  uri: settings.metrics
});
Emitter.setGlobalEmitter(metrics);
procMetrics(metrics, 1000 * 30);

stream.on('tweet', function (message) {
  const screenName = message.user.screen_name;
  const congrat = congrats.pick();

  if (message.in_reply_to_screen_name === 'myfirstpublish') {
    T.post('statuses/update', { status: '@' + screenName + ' ' + congrats }, function(err, data, response) {
      logger.info('sent congrats to @' + screenName);
      if (err) {
        logger.error(err);
      }
      process.emit('metric', {
        name: 'post',
        success: Boolean(err)
      });
    })
  }
})

