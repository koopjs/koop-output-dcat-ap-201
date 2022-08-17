import { DatasetFormatTemplate } from "./dcat-ap/dcat-formatters";

export const defaultFormatTemplate: DatasetFormatTemplate = {
    '@type': 'dcat:Dataset', // can't be overwritten
    '@id': '{{hubLandingPage}}', // can't be overwritten
    'dct:title': '{{name}}',
    'dct:description': '{{description}}',
    'dcat:contactPoint': {
        '@id': '{{ownerUri}}', // can't be overwritten
        '@type': 'Contact', // can't be overwritten
        'vcard:fn': '{{owner}}',
        'vcard:hasEmail': '{{orgContactEmail}}',
    },
    'dct:publisher': '{{orgTitle}}', // can't be overwritten
    'dcat:theme': 'geospatial', // can't be overwritten. TODO: update this to use this vocabulary http://publications.europa.eu/resource/authority/data-theme
    'dct:accessRights': 'public', // can't be overwritten
    'dct:identifier': '{{agoLandingPage}}',
    'dcat:keyword': '{{keyword}}', // can't be overwritten
    'dct:provenance': '{{provenance}}', // can't be overwritten. won't be available if not INSPIRE metadata
    'dct:issued': '{{issuedDateTime}}', // can't be overwritten
    'dct:language': '', // can't be overwritten, object computed at runtime
};