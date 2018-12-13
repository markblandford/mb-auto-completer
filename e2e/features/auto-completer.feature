Feature: Auto-Completer component

  Background:
    Given I am on the app start page

  Scenario: The auto-completer drop-down appears below when I press the down arrow
    Given I focus on the auto-complete input box with the id suffix "top"
    When  I press the "DOWN_ARROW" key
    Then  the the auto-completer list is displayed "below"

  Scenario: The auto-completer drop-down appears above when I press the down arrow
    Given I focus on the auto-complete input box with the id suffix "bottom"
    When  I press the "DOWN_ARROW" key
    Then  the the auto-completer list is displayed "above"