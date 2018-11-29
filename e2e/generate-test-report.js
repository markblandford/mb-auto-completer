const {
  generate
} = require('cucumber-html-reporter');
const {
  access
} = require('fs');

access('./e2e/reports/e2e-test-report.json', (err) => {
  if (err && err.code === 'ENOENT') {
    return;
  }

  const args = require('yargs').argv;

  const options = {
    theme: 'bootstrap',
    jsonFile: './e2e/reports/e2e-test-report.json',
    output: './e2e/reports/e2e-test-report.html',
    reportSuiteAsScenarios: true,
    launchReport: (args.suppressLaunch === undefined),
    brandTitle: 'mbAutoCompleter E2E Test Report'
  };

  generate(options);
});
