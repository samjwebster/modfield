# CHANGELOG.md
All updates are listed in reverse chronological order (newest first, oldest last).

# 1.1.0
- Breaking Change: Renamed the global library namespace from `ModField` to `modfield`. In code, change any calls using `ModField.function()` to `modfield.function()`.
- Minor Change: In the random generation API, it is now required to provide bounds (width and height) when generating random field groups or fields. If one is not provided, an error will be thrown.
- Minor Change: In the random generation API, it is now required to provide a scale when generating random modulators. If one is not provided, an error will be thrown.
- Minor Change: In the random generation API, specifying field, modulator, and aggregator types has been simplified; the redundant `xType` string parameter has been removed, leaving only the `xTypes` array parameter. To generate random objects with only one type, provide a single-element array. 
- Minor Change: In the random generation API, option nesting has been minimized. For generation functions that accept multiple configuration options (eg. field groups accept aggregator, field, and modulator options), they are parsed as separate parameters within the function argument options. For example, in `generateRandomFieldGroup()`, modulator options are now expected in `options.modulatorOptions`, not `options.fieldOptions.modulatorOptions`. 

# 1.0.0
- Initial Release