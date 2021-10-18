class Utils {
  static arrayBufferToBase64String(ab) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(ab)));
  }

  static stringToArrayBuffer(input) {
    // base64 to Buffer
    const binaryStr = atob(input)
    const bufUint8Array = Uint8Array.from(binaryStr, c => c.charCodeAt(0))
    const ab = bufUint8Array.buffer

    return ab
  }

  static deriveChallengeFromConsent(input) {
    return '12345'
  }
}