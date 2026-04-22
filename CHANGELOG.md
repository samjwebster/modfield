# CHANGELOG.md
All updates are listed in reverse chronological order (newest first, oldest last).

# 1.2.0 (4/22/2026)
- Improvement: Added a new default normalization method based on 5th and 95% statistical percentiles. To revert to the original minimum-maximum normalization, update `fg.normalize_mode` from `pcts` to `minmax`. 
- Improvement: FieldGroups now have a warming stage for computing normalization-related values, which computes mods for `warmingSteps=1000` steps. This can be updated directly or through a new method `setWarmingSteps(numSteps)`. 

# 1.1.0 (4/21/2026)
- Breaking Change: Renamed the global library namespace from `ModField` to `modfield`. In code, change any calls using `ModField.function()` to `modfield.function()`.
- Minor Change: In the random generation API, it is now required to provide bounds (width and height) when generating random field groups or fields. If one is not provided, an error will be thrown.
- Minor Change: In the random generation API, it is now required to provide a scale when generating random modulators. If one is not provided, an error will be thrown.
- Minor Change: In the random generation API, specifying field, modulator, and aggregator types has been simplified; the redundant `xType` string parameter has been removed, leaving only the `xTypes` array parameter. To generate random objects with only one type, provide a single-element array. 
- Minor Change: In the random generation API, option nesting has been minimized. For generation functions that accept multiple configuration options (eg. field groups accept aggregator, field, and modulator options), they are parsed as separate parameters within the function argument options. For example, in `generateRandomFieldGroup()`, modulator options are now expected in `options.modulatorOptions`, not `options.fieldOptions.modulatorOptions`. 

# 1.0.0 (4/20/2026)
- Initial Release