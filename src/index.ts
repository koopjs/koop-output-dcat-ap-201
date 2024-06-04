import { Request, Response } from 'express';
import * as _ from 'lodash';

import { version } from '../package.json';
import { getDataStreamDcatAp201 } from './dcat-ap';
import { TransformsList } from 'adlib';
import { DcatApError } from './dcat-ap/dcat-ap-error';

export = class OutputDcatAp201 {
  static type = 'output';
  static version = version;
  static routes = [
    {
      path: '/dcat-ap/2.1.1',
      methods: ['get'],
      handler: 'serve',
    },
  ];

  model: any;

  public async serve(req: Request, res: Response) {
    res.set('Content-Type', 'application/json');

    try {
      const feedTemplate = req.res?.locals?.feedTemplate as any;
      const feedTemplateTransformsDcatAp = req.app.locals.feedTemplateTransformsDcatAp as TransformsList;

      if (!feedTemplate) {
        throw new DcatApError('DCAT-AP 2.0.1 feed template is not provided.', 400);
      }

      const { dcatStream } = getDataStreamDcatAp201(feedTemplate, feedTemplateTransformsDcatAp);

      const datasetStream = await this.getDatasetStream(req);
      
      datasetStream.on('error', (err) => {
        if (req.next) {
          req.next(err);
        }
      }).pipe(dcatStream).pipe(res);

    } catch (err) {
      res.status(err.statusCode).send(this.getErrorResponse(err));
    }
  }

  private async getDatasetStream(req: Request) {
    try {
      return await this.model.pullStream(req);
    } catch (err) {
      if (err.status === 400) {
        throw new DcatApError(err.message, 400);
      }
      throw new DcatApError(err.message, 500);
    }
  }

  private getErrorResponse(err: any) {
    return {
      error: _.get(
        err,
        'message',
        'Encountered error while processing request',
      ),
    };
  }
};
