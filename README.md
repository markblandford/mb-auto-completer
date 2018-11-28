# MbAutoComplete

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.0.5.

## Demo

A demo of the component can be found here: https://markblandford.github.io/mb-auto-completer/. This demo is using [faker.js](https://github.com/marak/Faker.js/) to generate some random data for the list.

## Introduction

I love the [Angular Material Components](https://material.angular.io/components/categories), especially the fact that accessibility is built-in. However, I wanted to develop my own auto-complete component, which I could customise a little more than the one off the shelf. This lead me to develop this project.

It is an example of an auto-complete / typeahead component built using Angular CLI and using the [Angular Material CDK](https://material.angular.io/cdk/categories). The component has been developed with accessibility in mind (to the best of my knowledge) and so should work nicely without a mouse and screen readers (only tested with [MacOS VoiceOver](https://www.apple.com/uk/accessibility/mac/vision/)).

## Browser Support

* I have so far only tested this in Chrome (70) and Safari (11.1.2) and I assume it'll work in Firefox.
  * I'm sure this will work with IE 11, I've just not tested it or implemented the polyfills.

## Future Plans

* Implement end-to-end tests.
* Test with other screen readers.
  * Hopefully also refine the accessibility of the control if required. I've struggled to find any clear accessibility requirements for such a control.
* Add the ability to inject (using `@Input()` parameters?) css classes into the component to enable customised styling from outside of the component.
* Add further customisation such as populating the input when an item is selected etc.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
