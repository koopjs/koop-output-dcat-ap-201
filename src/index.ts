import { version } from '../package.json';

export = class Output {
    static type = 'output';
    static version = version;
    static routes = [
      {
        path: '/content',
        methods: ['get'],
        handler: 'serve'
      }
    ];

    // async serve (req, res) {

    // }
  }