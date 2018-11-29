const {
  After,
  Status
} = require('cucumber');

After(function (test) {
  if (test.result.status === Status.FAILED) {
    return browser.takeScreenshot().then(screenShot => this.attach(screenShot, 'image/png'));
  }
});