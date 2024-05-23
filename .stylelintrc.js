module.exports = {
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-standard-scss"
  ],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["use", "include", "mixin", "if", "else"]
      }
    ]
  }
}
