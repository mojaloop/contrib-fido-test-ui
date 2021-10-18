/// Globals
const state = {}

const model = new Model();

const authConfig = {
  callbacks: {
    onUserSignedIn: async (authUser) => {
      console.log('user signed in', authUser)
      const user = await model.getUserForPhoneNumber(authUser.phoneNumber)

      // Manually manipulate the UI


      setState({
        signInFormStatus: 'LOGIN_SUCCESS',
        phoneNumber: authUser.phoneNumber,
        user
      })
    },
    onUserSignedOut: () => { console.log('user signed out') }
  }
}

const auth = new Auth(authConfig)

window.onerror = function (message, url, line) {
  bulmaToast.toast({ message, type: 'is-danger' })

}

/// UI Elements
const loginSection = document.getElementById('loginSection')
const phoneNumberField = document.getElementById('phoneNumberField')
const phoneNumberFieldSet = document.getElementById('phoneNumberFieldSet')
const phoneNumberInput = document.getElementById('phoneNumberInput')
const verificationCodeField = document.getElementById('verificationCodeField')
const verificationCodeFieldSet = document.getElementById('verificationCodeFieldSet')
const otpInput = document.getElementById('otpInput')
const submitField = document.getElementById('submitField')
const submitPhoneNumberButton = document.getElementById('submitPhoneNumberButton')
const submitOTPButton = document.getElementById('submitOTPButton')
const saveDetailsButtonField = document.getElementById('saveDetailsButtonField')
const saveDetailsButton = document.getElementById('saveDetailsButton')
const loadingBar = document.getElementsByClassName('progress')[0]
const moreDetailsSection = document.getElementById('moreDetails')
const accountNicknameInput = document.getElementById('accountNicknameInput')
const logoutButton = document.getElementById('logoutButton')

// bind the listener here
logoutButton.onclick = onSignOutPressed

const nextStepsSection = document.getElementById('nextSteps')

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('submitPhoneNumberButton', {
  'size': 'invisible',
  'callback': (response) => {
    // reCAPTCHA solved, allow signInWithPhoneNumber.
    onSignInSubmit();
  }
});


/// Event Listeners

/**
 * @function onSignInPressed
 * @description When signIn is pressed by the user, send them an SMS
 */
function onSignInPressed() {
  const phoneNumber = phoneNumberInput.value
  const appVerifier = window.recaptchaVerifier;
  setState({
    signInFormStatus: 'SUBMIT_NUMBER_LOADING',
  })
  firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
    .then((confirmationResult) => {
      setState({ 
        signInFormStatus: 'OTP_SENT',
        phoneNumber,
      })

      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      window.confirmationResult = confirmationResult;
    }).catch((error) => {
      setState({
        signInFormStatus: 'LOGIN_FAILED',
      })
      return onSignInFailed(error);
    });
}

/**
 * @function onVerifyCodePressed()
 * @description After the user has entered the code, try and verify that it was correct
 */
function onVerifyCodePressed() {
  const code = otpInput.value

  setState({
    signInFormStatus: 'SUBMIT_OTP_LOADING',
  })
  confirmationResult.confirm(code)
  .then(async result => {
    // User signed in successfully.
    const authUser = result.user;
    const user = await model.getOrCreateUserForPhoneNumber(authUser.phoneNumber, {
      balance: 10000,
      phoneNumber: authUser.phoneNumber,
      uid: authUser.uid,
    })    
    
    setState({
      signInFormStatus: 'LOGIN_SUCCESS',
      user
    })

    bulmaToast.toast({ message: `Logged in user: ${state.phoneNumber}!`, type: 'is-primary' })
  }).catch((error) => {
    console.log("login failed with error", error)
    setState({
      signInFormStatus: 'LOGIN_FAILED',
    })
    return onVerifyCodeFailed(error)
  });
}

function onSignOutPressed() {
  auth.signOut()
  .then(() => {
    const homepage = window.location.toString().replace('/demo_account', '')
    window.location.replace(homepage)
  }).catch(err => {
    bulmaToast.toast({
      message: `<h1>Failed to sign out:</h1></br><p>${err}</p>`,
      type: 'is-danger',
      duration: 2000
    })
  })
}

function onSignInFailed(error) {
  window.recaptchaVerifier.render().then(function (widgetId) {
    grecaptcha.reset(widgetId);
  })

  bulmaToast.toast({ 
    message: `<h1>Sign In Failed with Error:</h1></br><p>${error}</p>`, 
    type: 'is-danger',
    duration: 2000 
  })
}

function onVerifyCodeFailed(error) {  
  bulmaToast.toast({
    message: `<h1>Sign In Failed with Error:</h1></br><p>${error}</p>`,
    type: 'is-danger',
    duration: 2000
  })
}

function onAccountDetailsFormChanged() {
  if (accountNicknameInput.value && accountNicknameInput.value.trim() !== "") {
    setState({accountDetailsFormStatus: 'FORM_COMPLETED'})
    return
  } 

  // Default to empty form!
  setState({ accountDetailsFormStatus: 'FORM_EMPTY' })
}

async function onSaveDetailsPressed() {
  setState({ accountDetailsFormStatus: 'SAVE_PRESSED_LOADING' })

  try {
    await model.updateAccountNickname(state.user.phoneNumber, accountNicknameInput.value.trim())
    setState({ accountDetailsFormStatus: 'FORM_EMPTY' })
    bulmaToast.toast({
      message: `<h1>Updated Details!</p>`,
      type: 'is-primary',
      duration: 2000
    })
  } catch (error) {
    setState({ accountDetailsFormStatus: 'FORM_COMPLETED' })
    bulmaToast.toast({
      message: `<h1>Failed to update details:</h1></br><p>${error}</p>`,
      type: 'is-danger',
      duration: 2000
    })
  }
}


/// State Management
const defaultState = {
  /// Where the sign in form is 'up to' depending on the SMS login flow steps
  /// NUMBER_ENTERED | SUBMIT_NUMBER_LOADING | OTP_SENT | SUBMIT_OTP_LOADING | LOGIN_SUCCESS | LOGIN_FAILED
  signInFormStatus: 'NUMBER_ENTERED',


  /// Where the account details form is up to
  /// FORM_EMPTY | FORM_COMPLETED | SAVE_PRESSED_LOADING | SAVED
  accountDetailsFormStatus: 'FORM_EMPTY',


  /// The phone number entered by the user
  phoneNumber: undefined,

  /// The user object in the database
  user: undefined
}

function setState(someFields) {
  const oldState = JSON.parse(JSON.stringify(state))
  const newState = Object.assign(state, someFields)

  onStateChanged(oldState, newState)
}


function onStateChanged(oldState, newState) {
  console.log('onStateChanged', oldState, newState)

  // if we logged in the user from a previous session
  // it would have gone from 'NUMBER_ENTERED' straight
  // to 'LOGIN_SUCCESS'

  // if (oldState.signInFormStatus === 'NUMBER_ENTERED' 
  //   && newState.signInFormStatus === 'LOGIN_SUCCESS') {
  //     loginSection.style.display = 'none'
  //   }

  if (newState.signInFormStatus === 'NUMBER_ENTERED') {
    phoneNumberField.style.display = 'block'
    verificationCodeField.style.display = 'none'
    submitPhoneNumberButton.disabled = false

    submitPhoneNumberButton.style.display = 'block'
    submitOTPButton.style.display = 'none'
  }

  if (newState.signInFormStatus === 'SUBMIT_NUMBER_LOADING') {
    submitPhoneNumberButton.disabled = true
    loadingBar.style.display = 'block'
  }
  
  if (newState.signInFormStatus === 'OTP_SENT') {
    phoneNumberField.style.display = 'block'
    phoneNumberFieldSet.disabled = true
    verificationCodeField.style.display = 'block'
    
    submitPhoneNumberButton.style.display = 'none'
    submitOTPButton.style.display = 'block'
    submitPhoneNumberButton.disabled = false
    
    loadingBar.style.display = 'none'
  }

  if (newState.signInFormStatus === 'SUBMIT_OTP_LOADING') {
    submitOTPButton.disabled = true
    loadingBar.style.display = 'block'
  }

  if (newState.signInFormStatus === 'LOGIN_SUCCESS') {
    loginSection.style.display = 'none'
    phoneNumberField.disabled = true
    verificationCodeFieldSet.disabled = true
    verificationCodeField.disabled = true
    moreDetailsSection.style.display = 'block'
    // Temp disabled... user's can't yet do this
    nextStepsSection.style.display = 'none'
    logoutButton.style.display = 'block'

    // No more interactions possible
    submitPhoneNumberButton.style.display = 'none'
    submitOTPButton.style.display = 'none'
    loadingBar.style.display = 'none'
  }
  if (newState.signInFormStatus === 'LOGIN_FAILED') {
    loadingBar.style.display = 'none'
  }

  if (newState.accountDetailsFormStatus === 'FORM_EMPTY') {
    saveDetailsButton.disabled = true
  }

  if (newState.accountDetailsFormStatus === 'FORM_COMPLETED') {
    saveDetailsButton.disabled = false
  }

  if (newState.accountDetailsFormStatus === 'SAVE_PRESSED_LOADING') {
    saveDetailsButton.disabled = true
    loadingBar.style.display = 'block'
  }

  if (newState.accountDetailsFormStatus === 'SAVED') {
    loadingBar.style.display = 'none'
  }


  // If we just loaded the user, and they have an account nickname,
  // pre-fill it
  if (!oldState.user && newState.user && newState.user.phoneNumber) {
    // TODO: some smarter formatting here?
    accountIdentifierInput.value = `MSISDN/${newState.user.phoneNumber.replace('+', '')}`
  }

  if (!oldState.user && newState.user && newState.user.accountNickname) {
    console.log('we just loaded an account nickname!')
    accountNicknameInput.value = newState.user.accountNickname
  }
}

// call setState with default values on first load
setState(defaultState)



