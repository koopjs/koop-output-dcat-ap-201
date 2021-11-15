import { DatasetFormatTemplate } from "./dcat-ap/dcat-formatters";

export const defaultFormatTemplate: DatasetFormatTemplate = {
    '@type': 'dcat:Dataset', // cannot be overwritten
    '@id': '{{landingPage}}', // cannot be overwritten (or can it?)
    'dct:title': '{{name}}',
    'dct:description': '{{description}}',
    'dcat:contactPoint': {
        '@id': '{{ownerUri}}', // should this be overwritten?
        '@type': 'Contact', // cannot be overwritten
        'vcard:fn': '{{owner}}',
        'vcard:hasEmail': '{{orgContactUrl}}',
    },
    'dct:publisher': '{{orgTitle}}',
    'dcat:theme': 'geospatial', // TODO update this to use this vocabulary http://publications.europa.eu/resource/authority/data-theme
    'dct:accessRights': 'public',
    'dct:identifier': '{{landingPage}}', // Wait, can this be overwritten too?
    'dcat:keyword': '{{keyword}}',
    'dct:provenance': '{{provenance}}', // won't be available if not INSPIRE metadata
    'dct:issued': '{{issuedDateTime}}',
    'dct:language': null,
};