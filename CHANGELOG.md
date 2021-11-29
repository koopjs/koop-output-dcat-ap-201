# CHANGELOG.md

## 1.3.1
Fixed
- Set proper status codes for errors [#12](https://github.com/koopjs/koop-output-dcat-ap-201/pull/12)

## 1.3.0
Added
- Support for `id` and `dcatConfig` query parameters [#11](https://github.com/koopjs/koop-output-dcat-ap-201/pull/11)

## 1.2.1

Fixed
- Scrub configurations that attempt to overwrite the 'dct:publisher', 'dct:provenance' and 'dct:accessRights' properties [#10](https://github.com/koopjs/koop-output-dcat-ap-201/pull/10)

## 1.2.0

Added
- support to use the custom template configuration found on the site's `data.feeds.dcatAP201` property [#9](https://github.com/koopjs/koop-output-dcat-ap-201/pull/9)

## 1.1.0

Added
- `orgContactEmail` as property of feed [#8](https://github.com/koopjs/koop-output-dcat-ap-201/pull/8)

## 1.0.1

Added
- Improved feed endpoint efficiency by only loading attributes used in the feed [#4](https://github.com/koopjs/koop-output-dcat-ap-201/pull/4)

Fixed
- WMS and WFS distributions are now attached when available [#6](https://github.com/koopjs/koop-output-dcat-ap-201/pull/6)

## 1.0.0

Added
- Basic DCAT-AP 2.0.1 feed generation [#1](https://github.com/koopjs/koop-output-dcat-ap-201/pull/1), [#2](https://github.com/koopjs/koop-output-dcat-ap-201/pull/2)