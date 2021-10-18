/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * Google
 - Steven Wijaya <stevenwjy@google.com>
 --------------
 ******/

import { Context } from 'openapi-backend'
import { Request, ResponseToolkit } from '@hapi/hapi'

import { ApiHandlers, ExtHandlers } from '../plugins/internal/openapi'
import * as Health from './health'

export const extHandlers: ExtHandlers = {
  notFound: (c: Context, __: Request, h: ResponseToolkit) => {
    console.log('returning 404 for request with path:', c.request.path)
    return h.response().code(404)
  },

  methodNotAllowed: (_: Context, __: Request, h: ResponseToolkit) => {
    return h.response().code(405)
  },

  validationFail: (c: Context, r: Request, h: ResponseToolkit) => {
    console.log('validation failed!!', JSON.stringify(c.validation.errors, null, 2))
    console.log('Request payload was:', r.payload)
    return h.response({ status: 400, err: c.validation.errors }).code(400);
  },
  notImplemented: (_: Context, __: Request, h: ResponseToolkit) => {
    return h.response().code(501)
  },
}

export const apiHandlers: ApiHandlers = {
  HealthGet: Health.get,
}
