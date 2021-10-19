/// Globals
const state = {}
window.onerror = function (message, url, line) {
  bulmaToast.toast({ message, type: 'is-danger' })
}
const cookieState = new CookieState()

/// example data
const examplePostConsentPayload = {
  consentId: "46876aac-5db8-4353-bb3c-a6a905843ce7",
  scopes: [{ "accountId": "dfspa.username.5678", "actions": ["accounts.transfer"] }],


  // consentId: '5a25c45c-0ac7-4d27-9363-b1d78fb108b5',
  // consentRequestId: '2db620c5-205e-46aa-a33a-56b9d226f84f',
  // scopes: [
  //   {
  //     accountId: '54c8847e-98e9-4a6e-9331-c0ff39509e8a',
  //     actions: [
  //       'ACCOUNTS_TRANSFER'
  //     ]
  //   }
  // ]
}

/// UI Elements
const enterConsentSection = document.getElementById('enterConsent')
const consentTextArea = document.getElementById('consentTextArea')
const submitConsentButton = document.getElementById('submitConsentButton')
const consentInvalidHelp = document.getElementById('consentInvalidHelp')
const enterDerivedChallengeSection = document.getElementById('enterDerivedChallenge')
const submitChallengeField = document.getElementById('submitChallengeField')
const generatedChallengeInput = document.getElementById('generatedChallengeInput')
const submitChallengeButton = document.getElementById('submitChallengeButton')
const registerCredentialSection = document.getElementById('registerCredential')
const registerCredentialButton = document.getElementById('registerCredentialButton')
const registrationSuccessSection = document.getElementById('registrationSuccess')
const credentialCopy = document.getElementById('credentialCopy')
const credentialIdCopy = document.getElementById('credentialIdCopy')
const moreInfoSection = document.getElementById('moreInfo')
const decodedClientDataJSON = document.getElementById('decodedClientDataJSON')
const decodedCredentialIdCopy = document.getElementById('decodedCredentialIdCopy')
const nextStepsSection = document.getElementById('nextSteps')
const loadingBar = document.getElementsByClassName('progress')[0]


/// Event Listeners

function consentTextAreaOnInput(value) {  
  // ignore first field fields of input
  if (value.length < 4) {
    this.setState({ createCredentialFormStatus: 'EMPTY' })

    return
  }

  // validate the json
  let parsed 
  try {
    parsed = JSON.parse(value)
  } catch (err) {
    this.setState({ createCredentialFormStatus: 'CONSENT_ENTERED_INVALID'})
    return
  }

  if (!parsed.consentId || !parsed.scopes) {
    this.setState({ createCredentialFormStatus: 'CONSENT_ENTERED_INVALID' })
    return
  }

  if (!Array.isArray(parsed.scopes) || parsed.scopes.length === 0) {
    this.setState({ createCredentialFormStatus: 'CONSENT_ENTERED_INVALID' })
    return
  }


  // TODO: Make sure required fields exist
  this.setState({ 
    createCredentialFormStatus: 'CONSENT_ENTERED_VALID',
    consent: parsed
  })
}

/**
 * @function onSubmitConsentPressed
 * @description When submitConsent is pressed by the user, generate the challenge
 */
async function onSubmitConsentPressed() {
  const challenge = await Utils.deriveChallengeFromConsent(state.consent)

  this.setState({
    createCredentialFormStatus: 'CHALLENGE_GENERATED',
    challenge,
  })
  
}

/**
 * @function onSubmitChallengePressed()
 * @description After the user verified the challenge allow them to accept it
 */
function onSubmitChallengePressed() {
  this.setState({
    createCredentialFormStatus: 'CHALLENGE_ACCEPTED'
  })
}

/**
 * @function onRegisterCredentialButtonPressed()
 * @description Call navigator.credentials.create
 */
async function onRegisterCredentialButtonPressed() {
  const challenge = state.challenge
  const rpId = window.location.hostname

  // TODO: tweak these options to work with Auth Service
  const options = {
    publicKey: {
      attestation: "direct",
      authenticatorSelection: {
        userVerification: 'discouraged',
        // authenticatorAttachment: "cross-platform",
      },
      challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
      pubKeyCredParams: [
        {
          alg: -7,
          type: "public-key"
        },
        // {
        //   alg: -257,
        //   type: "public-key"
        // }
      ],
      rp: {
        id: rpId,
        name: "Mojaloop 3PPI"
      },
      timeout: 90000,
      // TODO: what do we do about the user?
      user: {
        id: Uint8Array.from("UZSL85T9AFC", c => c.charCodeAt(0)),
        name: "test@example.com",
        displayName: "Moja",
      },
    }
  }

  console.log('calling navigator.credentials.create with options:')
  console.log(options)

  this.setState({ createCredentialFormStatus: 'REGISTER_LOADING'})
  return navigator.credentials.create(options)
  .then(result => {
    console.log('result is', result)

    const credential = {
      id: result.id,
      rawId: Utils.arrayBufferToBase64String(result.rawId),
      response: {
        attestationObject: Utils.arrayBufferToBase64String(result.response.attestationObject),
        clientDataJSON: Utils.arrayBufferToBase64String(result.response.clientDataJSON),
      },
      type: result.type
    }

    const decodedAttestationObject = window.cbor.decodeFirstSync(result.response.attestationObject)
    const { authData } = decodedAttestationObject;
    const dataView = new DataView(
      new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach(
      (value, index) => dataView.setUint8(
        index, value));
    const credentialIdLength = dataView.getUint16();

    // get the credential ID
    const decodedCredentialId = authData.slice(
      55, 55 + credentialIdLength);

    // save the last credential to local state
    cookieState.set(credential.rawId)

    this.setState({ 
      createCredentialFormStatus: 'REGISTER_SUCCESS',
      credential,
      decodedAttestationObject,
      decodedCredentialId,
    })
  })
  .catch(err => {
    console.log(err)
    this.setState({ createCredentialFormStatus: 'REGISTER_ERROR' })
    onRegisterCredentialFailed(err)
  })
}

function onRegisterCredentialFailed(error) {  
  bulmaToast.toast({
    message: `<h1>Failed to Register Credential with error: </h1></br><p>${error}</p>`,
    type: 'is-danger',
    duration: 2000
  })

  setTimeout(() => this.setState({ createCredentialFormStatus: 'CHALLENGE_ACCEPTED'}), 2000)
}


/// State Management
const defaultState = {
  /// Where the create credential form is up to depending on the user's input
  /// EMPTY | CONSENT_ENTERED_VALID | CONSENT_ENTERED_INVALID | CHALLENGE_GENERATED | CHALLENGE_ACCEPTED | REGISTER_LOADING | REGISTER_ERROR | REGISTER_SUCCESS
  createCredentialFormStatus: 'EMPTY',

  /// The consent object entered by the user
  consent: undefined,

  /// The challenge generated by this site from the consent
  generatedChallenge: undefined,

  /// The credential returned by the webauthn api
  credential: undefined,

  // The decoded attestation object
  decodedAttestationObject: undefined,

  // The credential id decoded from the registration result:
  decodedCredentialId: undefined
}

function setState(someFields) {
  const oldState = JSON.parse(JSON.stringify(state))
  const newState = Object.assign(state, someFields)

  onStateChanged(oldState, newState)
}


function onStateChanged(oldState, newState) {
  // console.log('onStateChanged', oldState, newState)

  if (newState.createCredentialFormStatus === 'EMPTY') {
    [
      enterDerivedChallengeSection,
      registerCredentialSection,
      registrationSuccessSection,
      moreInfo,
      nextStepsSection
    ].forEach(s => s.style.display = 'none')
  }

  if (newState.createCredentialFormStatus === 'CONSENT_ENTERED_INVALID') {
    consentInvalidHelp.style.display = 'block'
    submitConsentButton.style.display = 'none'
  }

  if (newState.createCredentialFormStatus === 'CONSENT_ENTERED_VALID') {
    consentInvalidHelp.style.display = 'none'
    submitConsentButton.style.display = 'block'
  }

  if (oldState.createCredentialFormStatus === 'CONSENT_ENTERED_VALID' 
    && newState.createCredentialFormStatus === 'CHALLENGE_GENERATED') {
    submitConsentButton.style.display = 'none'
    enterDerivedChallenge.style.display = 'block'
    generatedChallengeInput.value = newState.challenge
  }

  if (newState.createCredentialFormStatus === 'CHALLENGE_ACCEPTED') {
    registerCredential.style.display = 'block'
    registerCredentialButton.style.display = 'block'
  }

  if (newState.createCredentialFormStatus === 'REGISTER_LOADING') {
    registerCredentialButton.style.display = 'none'
    loadingBar.style.display = 'block'
  }

  if (newState.createCredentialFormStatus === 'REGISTER_SUCCESS') {
    registrationSuccess.style.display = 'block'
    loadingBar.style.display = 'none'
    moreInfoSection.style.display = 'block'
    nextStepsSection.style.display = 'block'

    credentialCopy.textContent = JSON.stringify(newState.credential, null, 2)
    credentialIdCopy.textContent = newState.credential.rawId
    decodedClientDataJSON.textContent = atob(newState.credential.response.clientDataJSON)
    decodedCredentialIdCopy.textContent = Utils.arrayBufferToBase64String(newState.decodedCredentialId)
  }

  if (newState.createCredentialFormStatus === 'REGISTER_ERROR') {
    loadingBar.style.display = 'none'
  }
}

// call setState with default values on first load
setState(defaultState)



// Uncomment to set example data:
// consentTextArea.value = JSON.stringify(examplePostConsentPayload, null, 2)

