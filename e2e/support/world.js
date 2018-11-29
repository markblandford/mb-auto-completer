const {
  setWorldConstructor
} = require('cucumber');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

global.expect = chai.expect;

function World({
  attach,
  parameters
}) {
  this.attach = attach;
  this.parameters = parameters;
}

setWorldConstructor(World);
