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
 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import Path from 'path'
import convict from 'convict'
import * as dotenv from 'dotenv'

import Package from '../../package.json'

convict.addFormat({
  name: 'firebase-web-config',
  validate: val => {
    console.log('val is', val)
  },
  coerce: (val) => {
    return JSON.parse(val)
  }
})

// Setup config to read environment variables from '.env' file.
dotenv.config()

// Config definition
const config = convict({
  package: {
    name: {
      doc: 'The application name.',
      default: 'contrib-firebase-simulator',
    },
    version: {
      doc: 'The application version.',
      default: '0.1.0',
    },
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  hostname: {
    doc: 'Host name for the server.',
    format: '*',
    default: 'pisp-demo-server.local',
    env: 'HOST',
    arg: 'hostname',
  },
  ip: {
    doc: 'The IP address to bind.',
    format: '*',
    default: '0.0.0.0',
    env: 'IP_ADDRESS',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 8080,
    env: 'PORT',
    arg: 'port',
  },
  participantId: {
    doc: 'Participant ID of this DFSP',
    format: String,
    default: 'bankone',
    env: 'PARTICIPANT_ID',
  },
  readableParticipantName: {
    doc: 'A Human readable version of the participant\'s name',
    format: String,
    default: 'BankOne',
    env: 'READABLE_PARTICIPANT_NAME',
  },
  db: {
    firebase: {
      keyPath: {
        doc: 'Path to service account key for Firebase',
        format: '*',
        default: Path.resolve(__dirname, '../../config/serviceAccountKey.json'),
        env: 'FIREBASE_KEY_PATH',
      },
      url: {
        doc: 'Url for the database',
        format: '*',
        default: '',
        env: 'FIREBASE_URL',
      },
    },
  },
  demoCurrency: {
    doc:
      'An ISO 4217 currency code to replace other values with for demo purposes',
    format: '*',
    default: 'PHP',
    env: 'DEMO_CURRENCY',
  },
  basePath: {
    doc: 'The base path to set for the public UI site',
    format: String,
    default: '',
    env: 'BASE_PATH'
  },
  SHOULD_SEND_LIVE_SMS: {
    doc: 'If true, will send live SMS messages using Twilio',
    format: Boolean,
    default: false,
    env: 'SHOULD_SEND_LIVE_SMS'
  },
  TWILIO_ACCOUNT_SID: {
    doc: 'The Twilio account sid',
    format: String,
    default: '',
    env: 'TWILIO_ACCOUNT_SID'
  },
  TWILIO_AUTH_TOKEN: {
    doc: 'The twilio auth token',
    format: String,
    default: '',
    env: 'TWILIO_AUTH_TOKEN'
  },
  TWILIO_PHONE_NUMBER: {
    doc: 'The intl formatted phone number we bought with twilio',
    format: String,
    default: '',
    env: 'TWILIO_PHONE_NUMBER'
  },
  LIVE_TEST_NUMBER: {
    doc: 'A live number to test sending SMS messages to.',
    format: String,
    default: '',
    env: 'LIVE_TEST_NUMBER'
  },
  publicFirebaseConfig: {
    doc: 'The firebase config to inject into a webpage',
    format: 'firebase-web-config',
    default: {
      apiKey: "AIzaSyAutx48B3lq_QZqJU2jwj-QDu-VqZ88vY8",
      authDomain: "contrib-firebase-simulator.firebaseapp.com",
      projectId: "contrib-firebase-simulator",
      storageBucket: "contrib-firebase-simulator.appspot.com",
      messagingSenderId: "951485074686",
      appId: "1:951485074686:web:796d64c8ab5723630069af"
    },
    env: 'PUBLIC_FIREBASE_CONFIG'
  },
})

config.load({
  package: {
    name: Package.name,
    version: Package.version,
  },
})

// extra validation
if (config.get('basePath') === '/') {
  throw new Error('basePath must not be `/`. For an empty basePath, set to empty string.')
}

export type ServiceConfig = typeof config
export default config
