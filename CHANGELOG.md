# CHANGELOG.md

## 2.3.0
- Added `dct` context to DCAT AP 3.0.0 header [#68](https://github.com/koopjs/koop-output-dcat-ap-201/pull/45)

## 2.2.0
- Added support for DCAT AP 3.0 [#67](https://github.com/koopjs/koop-output-dcat-ap-201/pull/44)

## 2.1.1
- Handle stream error [#43](https://github.com/koopjs/koop-output-dcat-ap-201/pull/43)

## 2.1.0
- Version bump to DCAT 2.1.1

## 2.0.2
- Added `access` and `xsd` context for DCAT AP 2.1.1 upgrade [#40](https://github.com/koopjs/koop-output-dcat-ap-201/pull/41)

## 2.0.1
- Added `skos` context to define `dcat:theme` [#40](https://github.com/koopjs/koop-output-dcat-ap-201/pull/40)

## 2.0.0
BREAKING CHANGES
- Decouples this output plugin from the `hub-search` provider to better align with Koop JS patterns[#38](https://github.com/koopjs/koop-output-dcat-ap-201/pull/38)

## 1.9.1
Fixed
- Fixed missing modified property issue in datasets [#24](https://github.com/koopjs/koop-output-dcat-ap-201/pull/24)

## 1.9.0
Added
- ability to sort and text search the feed [#22](https://github.com/koopjs/koop-output-dcat-ap-201/pull/22)

## 1.8.1
Fixed
- Additional metadata now available as distribution [#21](https://github.com/koopjs/koop-output-dcat-ap-201/pull/21)

## 1.8.0
Added
- dct:identifier is now a customizable attribute and defaults to the AGO home page for an item [#20](https://github.com/koopjs/koop-output-dcat-ap-201/pull/20)

## 1.7.1
Fixed
- Fixed type issue in underlying Hub.js dependency [#19](https://github.com/koopjs/koop-output-dcat-ap-201/pull/19)

## 1.7.0
Added
- If the `dcat:distribution` property of a site's dcat config is an array, those custom distributions will now be prepended to the distributions list [#18](https://github.com/koopjs/koop-output-dcat-ap-201/pull/18)

## 1.6.2
Fixed
- Access Urls for downloadable distributions have corrected url [#17](https://github.com/koopjs/koop-output-dcat-ap-201/pull/17)

## 1.6.1
Fixed
- License defaults now properly work [#16](https://github.com/koopjs/koop-output-dcat-ap-201/pull/16)

## 1.6.0
Added
- Distributions for proxied CSVs now include a csv distribution [#15](https://github.com/koopjs/koop-output-dcat-ap-201/pull/15)

## 1.5.0
Added
- Empty strings as fallback values for non-editable fields [#13](https://github.com/koopjs/koop-output-dcat-ap-201/pull/14)

## 1.4.0
Added
- Handling for path hierchies and fallback values [#13](https://github.com/koopjs/koop-output-dcat-ap-201/pull/13)

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