import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, X, RotateCcw, FlipHorizontal } from 'lucide-react'

/**
 * CameraCapture — getUserMedia wrapper with live preview and capture.
 * Props:
 *   onCapture(file: File) — called when user captures a frame
 *   onError(msg: string)  — called on permission / hardware error
 */
export default function CameraCapture({ onCapture, onError }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [facingMode, setFacingMode] = useState('environment') // rear camera by default
  const [isReady, setIsReady]       = useState(false)
  const [capturedBlob, setCapturedBlob] = useState(null)

  const startCamera = useCallback(async (facing = facingMode) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setIsReady(true)
        }
      }
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device. Please use the Upload tab instead.'
          : `Camera error: ${err.message}`
      onError?.(msg)
    }
  }, [facingMode, onError])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacing)
    setIsReady(false)
    setCapturedBlob(null)
    startCamera(newFacing)
  }

  const capture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        setCapturedBlob(blob)
        const file = new File([blob], 'currency_scan.jpg', { type: 'image/jpeg' })
        onCapture?.(file)
      },
      'image/jpeg',
      0.92,
    )
  }

  const retake = () => {
    setCapturedBlob(null)
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
      {/* Live preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${capturedBlob ? 'hidden' : ''}`}
      />

      {/* Captured frame */}
      {capturedBlob && (
        <img
          src={URL.createObjectURL(capturedBlob)}
          alt="Captured note"
          className="w-full h-full object-cover"
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Alignment guide overlay */}
      {!capturedBlob && isReady && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/40 rounded-lg">
            {/* Corner markers */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5 border-white border-2
                                        ${i === 0 ? 'border-r-0 border-b-0 rounded-tl' :
                                          i === 1 ? 'border-l-0 border-b-0 rounded-tr' :
                                          i === 2 ? 'border-r-0 border-t-0 rounded-bl' :
                                                    'border-l-0 border-t-0 rounded-br'}`} />
            ))}
          </div>
          <p className="absolute bottom-16 left-0 right-0 text-center text-white/70 text-xs">
            Align the note within the frame
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {!isReady && !capturedBlob && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <Camera className="w-10 h-10 text-clarion-muted mx-auto mb-2 animate-pulse" />
            <p className="text-clarion-muted text-sm">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
        {!capturedBlob ? (
          <>
            <button
              onClick={toggleCamera}
              className="w-10 h-10 rounded-full bg-black/50 border border-white/20
                         flex items-center justify-center text-white hover:bg-black/70 transition"
              title="Flip camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={capture}
              disabled={!isReady}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/40
                         hover:scale-110 transition-transform duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg"
              title="Capture"
            >
              <span className="sr-only">Capture</span>
            </button>
            <div className="w-10 h-10" /> {/* Spacer */}
          </>
        ) : (
          <button
            onClick={retake}
            className="flex items-center gap-2 bg-black/50 border border-white/20
                       text-white px-4 py-2 rounded-full text-sm hover:bg-black/70 transition"
          >
            <RotateCcw className="w-4 h-4" /> Retake
          </button>
        )}
      </div>
    </div>
  )
}
