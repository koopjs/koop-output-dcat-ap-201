# Koop Provider DCAT-AP 2.0.1

[![TypeScript version][ts-badge]][typescript-4-3]
[![Node.js version][nodejs-badge]][nodejs]
[![APLv2][license-badge]][license]
[![Build Status - GitHub Actions][gha-badge]][gha-ci]

This is a Koop output plugin that transforms datasets from the ArcGIS Hub Search API into a DCAT-AP 2.0.1 feed encoded in RDF/JSON-LD. It currently only supports exporting a search catalog from an entire Hub Site.

Here is an example feed:
```json
{
  "@context": {
    "dcat": "http://www.w3.org/ns/dcat#",
    "dct": "http://purl.org/dc/terms/",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "vcard": "http://www.w3.org/2006/vcard/ns#",
    "ftype": "http://publications.europa.eu/resource/authority/file-type/",
    "lang": "http://publications.europa.eu/resource/authority/language/"
  },
  "@id": "https://download-test-qa-pre-a-hub.hubqa.arcgis.com",
  "@type": "dcat:Catalog",
  "dct:description": "Create your own initiative by combining existing applications with a custom site. Use this initiative to form teams around a problem and invite your community to participate.",
  "dct:title": "download test",
  "dct:publisher": "QA Premium Alpha Hub",
  "foaf:homepage": {
    "foaf:Document": "https://download-test-qa-pre-a-hub.hubqa.arcgis.com/search"
  },
  "dct:language": {
    "@id": "lang:ENG"
  },
  "dct:creator": {
    "@id": "https://qa-pre-a-hub.maps.arcgis.com",
    "@type": "foaf:Agent",
    "foaf:name": "QA Premium Alpha Hub"
  },
  "dcat:dataset": [
    {
      "@type": "dcat:Dataset",
      "@id": "https://download-test-qa-pre-a-hub.hubqa.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0",
      "dct:title": "Tahoe places of interest",
      "dct:description": "Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.",
      "dcat:contactPoint": {
        "@id": "https://qa-pre-a-hub.maps.arcgis.com/sharing/rest/community/users/thervey_qa_pre_a_hub?f=json",
        "@type": "Contact",
        "vcard:fn": "thervey_qa_pre_a_hub",
        "vcard:hasEmail": null
      },
      "dct:publisher": "QA Premium Alpha Hub",
      "dcat:theme": "geospatial",
      "dct:accessRights": "public",
      "dct:identifier": "https://download-test-qa-pre-a-hub.hubqa.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0",
      "dct:language": {
        "@id": "lang:GER"
      },
      "dcat:keyword": [
        "some",
        "keywords",
        "from",
        "metadata"
      ],
      "dct:provenance": "Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)",
      "dct:issued": "2021-04-19T13:30:24.055-04:00",
      "dcat:distribution": [
        {
          "@type": "dcat:Distribution",
          "dcat:accessUrl": "https://download-test-qa-pre-a-hub.hubqa.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0",
          "dct:format": {
            "@id": "ftype:HTML"
          },
          "dct:description": "Web Page",
          "dct:title": "ArcGIS Hub Dataset"
        }
      ]
    }
  ]
}
```

See the [DCAT-AP specification](https://joinup.ec.europa.eu/collection/semantic-interoperability-community-semic/solution/dcat-application-profile-data-portals-europe/release/201-0) for more information.

## Use
Visit the [KoopJS docs](https://github.com/koopjs/koop-output-dcat-ap-201) for instructions on building and deploying a Koop app.

**Important!** This plugin requires the [`@koopjs/koop-provider-hub-search`](https://github.com/koopjs/koop-provider-hub-search) provider to function.

## Develop
```sh
# clone and install dependencies
git clone https://github.com/koopjs/koop-output-dcat-ap-201
cd koop-output-dcat-ap-201
npm i

# starts the example Koop app found in ./example-app.
npm run dev
```

## Test
Run the `npm t` commmand to spin up the automated tests.
