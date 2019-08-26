"use strict";

let glory = require("./lib/glory");

let triggerCodeBuild = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  glory.triggerCodeBuild(event, callback);
};

let emailReport = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  glory.emailReport(event, callback);
};

module.exports = {
  triggerCodeBuild: triggerCodeBuild,
  emailReport: emailReport
};
