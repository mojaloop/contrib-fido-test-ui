/// Globals
const state = {}
window.onerror = function (message, url, line) {
  bulmaToast.toast({ message, type: 'is-danger' })

}
const cookieState = new CookieState()
const lastCredentialId = cookieState.get()


/// UI Elements
const enterChallengeSection = document.getElementById('enterChallenge')
const credentialIdInput = document.getElementById('credentialIdInput')
const assertionResult = document.getElementById('assertionResult')
const assertionCopy = document.getElementById('assertionCopy')
const loadingBar = document.getElementsByClassName('progress')[0]



/// Event Listeners

function onFormInput() {
  const challenge = state.challenge
  const credentialId = state.credentialId

  // check for initial values
  if (!challenge || !credentialId) {
    this.setState({formStatus: 'EMPTY'})
    return
  }

  // check for too short strings
  if (challenge.length < 4 || credentialId.length < 4) {
    this.setState({ formStatus: 'EMPTY' })
    return
  }

  this.setState({ formStatus: 'FIELDS_ENTERED_VALID'})
}

function challengeOnInput(value) {
  this.setState({challenge: value})
  onFormInput(value, null)
}

function credentialIdOnInput(value) {
  this.setState({ credentialId: value })
  onFormInput(null, value)
}

/**
 * @function onSubmitChallengePressed
 * @description When onSubmitChallenge is pressed by the user, generate the assertion
 */
async function onSubmitChallengePressed() {
  const rpId = window.location.hostname
  this.setState({
    formStatus: 'VERIFY_LOADING',
  })
  
  const options = {
    publicKey: {
      rpId,
      userVerification: 'discouraged',
      challenge: Uint8Array.from(state.challenge, c => c.charCodeAt(0)),
      allowCredentials: [{
        id: Utils.stringToArrayBuffer(state.credentialId),
        type: 'public-key',
      }],
      timeout: 60000,
    }
  }
  
  console.log('calling navigator.credentials.get with options:')
  console.log(options)

  return navigator.credentials.get(options)
    .then(result => {
      console.log('result', result)

      const assertionResult = {
        id: result.id,
        rawId: Utils.arrayBufferToBase64String(result.rawId),
        response: {
          authenticatorData: Utils.arrayBufferToBase64String(result.response.authenticatorData),
          clientDataJSON: Utils.arrayBufferToBase64String(result.response.clientDataJSON),
          signature: Utils.arrayBufferToBase64String(result.response.signature),
        },
        type: result.type
      }

      this.setState({
        formStatus: 'VERIFY_SUCCESS',
        assertionResult
      })
    }).catch(err => {
      this.setState({
        formStatus: 'VERIFY_ERROR',
      })

      console.log('error', err)
      onSubmitChallengeError(err)
    })
}

function onSubmitChallengeError(error) {  
  bulmaToast.toast({
    message: `<h1>Failed to Register Credential with error: </h1></br><p>${error}</p>`,
    type: 'is-danger',
    duration: 2000
  })

  setTimeout(() => this.setState({ formStatus: 'FIELDS_ENTERED_VALID'}), 2000)
}

/// State Management
const defaultState = {
  /// Where the create credential form is up to depending on the user's input
  /// EMPTY | FIELDS_ENTERED_VALID | FIELDS_ENTERED_INVALID | VERIFY_LOADING | VERIFY_ERROR | VERIFY_SUCCESS
  formStatus: 'EMPTY',

  /// The challenge entered by the user
  challenge: undefined,

  /// The credentialId entered by the user
  credentialId: undefined,

  /// Result
  assertionResult: undefined
}

function setState(someFields) {
  const oldState = JSON.parse(JSON.stringify(state))
  const newState = Object.assign(state, someFields)

  onStateChanged(oldState, newState)
}

function onStateChanged(oldState, newState) {
  // console.log('onStateChanged', oldState, newState)

  if (newState.formStatus === 'EMPTY') {
    enterChallengeSection.style.display = 'block'
    submitChallengeButton.style.display = 'none'
    assertionResult.style.display = 'none'
  }

  if (newState.formStatus === 'FIELDS_ENTERED_VALID') {
    submitChallengeButton.style.display = 'block'
    loadingBar.style.display = 'none'
  }

  if (newState.formStatus === 'VERIFY_LOADING') {
    submitChallengeButton.style.display = 'none'
    loadingBar.style.display = 'block'
  }

  if (newState.formStatus === 'VERIFY_ERROR') {
    submitChallengeButton.style.display = 'block'
    loadingBar.style.display = 'none'
  }

  if (newState.formStatus === 'VERIFY_SUCCESS') {
    submitChallengeButton.style.display = 'none'
    assertionResult.style.display = 'block'
    loadingBar.style.display = 'none'

    assertionCopy.textContent = JSON.stringify(newState.assertionResult, null, 2)
  }

  
}


if (lastCredentialId) {
  credentialIdInput.value = lastCredentialId
  defaultState.credentialId = lastCredentialId
}

// call setState with default values on first load
setState(defaultState)



