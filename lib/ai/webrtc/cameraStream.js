export async function startCameraStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })

    return {
      status: 'STREAM_ACTIVE',
      stream
    }
  } catch (error) {
    return {
      status: 'STREAM_FAILED',
      error: error.message
    }
  }
}
