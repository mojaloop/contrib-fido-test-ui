class Utils {
  static arrayBufferToString(ab) {
    return String.fromCharCode.apply(null, new Uint8Array(ab));
  }

  static stringToArrayBuffer(input) {
    // base64url to base64
    input = input.replace(/-/g, '+').replace(/_/g, '/')
    // base64 to Buffer
    const buf = Buffer.from(input, 'base64')
    const bufUint8Array = new Uint8Array(buf)
    const ab = bufUint8Array.buffer

    return ab
  }
}