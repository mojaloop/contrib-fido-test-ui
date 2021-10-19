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
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../ambient.d.ts"/>

import { Server } from '@hapi/hapi'
import { ServiceConfig } from '../shared/config'
import onValidateFail from './handlers/onValidateFail'
import extensions from './extensions'
import plugins from './plugins'
import path from 'path'
import hbs from 'hbs'

export default async function create(
  config: ServiceConfig
): Promise<StateServer> {
  let server = new Server({
    host: config.get('ip'),
    port: config.get('port'),
    routes: {
      files: {
        relativeTo: path.join(__dirname, '..', 'public')
      },
      validate: {
        failAction: onValidateFail,
      },
    },
  })

  const globalContext: Record<string, unknown> = {
    participantId: config.get('participantId'),
    readableParticipantName: config.get('readableParticipantName'),
    firebaseConfig: config.get('publicFirebaseConfig'),
    versionString: `v${config.get('package.version')}`
  }

  if (config.get('basePath').length > 0 ) {
    globalContext['baseUrl'] = config.get('basePath')
  }

  server = await plugins.register(server)
  extensions.register(server)
  server.views({
    engines: {
      // @ts-ignore
      html: hbs
    },
    relativeTo: path.join(__dirname, '..'),
    path: 'templates',
    partialsPath: 'templates/partials'
  });

  // Catchall route
  server.route({
    method: 'GET',
    path: `${config.get('basePath')}/{param*}`,
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true
      }
    }
  });

  // Specific templated routes
  let indexRoute = {
    method: 'GET',
    path: `${config.get('basePath')}`,
    handler: {
      view: {
        template: 'index',
        context: {
          ...globalContext
        }
      }
    }
  }
  if (config.get('basePath') === '') {
    indexRoute = {
      method: 'GET',
      path: `/`,
      handler: {
        view: {
          template: 'index',
          context: {
            ...globalContext
          }
        }
      }
    }
  }
  server.route([
    indexRoute,
  {
    method: 'GET',
    path: `${config.get('basePath')}/create_credential`,
    handler: {
      view: {
        template: 'create_credential',
        context: {
          ...globalContext
        }
      }
    }
  },
  {
    method: 'GET',
    path: `${config.get('basePath')}/verify_transaction`,
    handler: {
      view: {
        template: 'verify_transaction',
        context: {
          ...globalContext
        }
      }
    }
  }]);


  return server as StateServer
}
