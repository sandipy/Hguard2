/**
 * Senior & Halo Alert Monitoring Service
 * Provides hands-free zero-touch voice distress keyword detection,
 * auto-answer two-way intercom, and rapid descent + floor immobility fall tracking.
 */
import { globalStreamChannel } from './streamChannel';
import { playEmergencyAlarmSiren, playWalkieTalkieChirp, playRogerBeep, speakSeniorVoice } from './soundAlerts';

export interface SeniorAlertData {
  type: 'fall_detected' | 'voice_help' | 'wandering' | 'sound_surge' | 'alert_cleared';
  keyword?: string;
  source: string;
  message: string;
  timestamp: number;
}

export class SeniorMonitorService {
  private static instance: SeniorMonitorService;

  private isListeningVoiceHelp = false;
  private isAutoAnswerActive = false;
  private speechRecognizer: any = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private audioMonitorInterval: any = null;
  private alertListeners: ((alert: SeniorAlertData) => void)[] = [];
  private seniorTranscriptListeners: ((transcript: string) => void)[] = [];

  // Fall tracking state
  private lastCentroidY: number = 0.3;
  private lastCentroidTime: number = 0;
  private potentialFallDetectedAt: number | null = null;
  private fallConfirmed = false;
  private isEmergencyActive = false;

  private constructor() {
    // Singleton
  }

  public static getInstance(): SeniorMonitorService {
    if (!SeniorMonitorService.instance) {
      SeniorMonitorService.instance = new SeniorMonitorService();
    }
    return SeniorMonitorService.instance;
  }

  /**
   * Start hands-free continuous voice distress listener ("Halo Alert" mode).
   * Listens for "Help!", "Help me!", "I fell!", "Emergency!" without pressing buttons.
   */
  public startVoiceHelpListener(onAlertCallback?: (alert: SeniorAlertData) => void) {
    if (this.isListeningVoiceHelp) return;
    this.isListeningVoiceHelp = true;

    if (onAlertCallback) {
      this.alertListeners.push(onAlertCallback);
    }

    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = false;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript.toLowerCase().trim();
              console.log('[SeniorMonitor] Voice detected:', transcript);

              // Broadcast transcript if auto-answer intercom is active
              if (this.isAutoAnswerActive) {
                this.seniorTranscriptListeners.forEach((cb) => cb(transcript));
                globalStreamChannel.sendRemoteCommand('SENIOR_REPLY_TRANSMIT', 'all', transcript);
              }

              // 1. Check for hands-free dismissal phrases ("I am okay", "False alarm", etc.)
              if (
                transcript.includes('i am okay') ||
                transcript.includes("i'm okay") ||
                transcript.includes('i am fine') ||
                transcript.includes("i'm fine") ||
                transcript.includes('false alarm') ||
                transcript.includes('cancel alert') ||
                transcript.includes("it's okay") ||
                transcript.includes('all good')
              ) {
                this.clearSeniorAlerts(transcript);
                return;
              }

              // 2. Check for emergency & distress keywords
              if (
                transcript.includes('help') ||
                transcript.includes('help me') ||
                transcript.includes('i fell') ||
                transcript.includes('fallen') ||
                transcript.includes('emergency') ||
                transcript.includes('call someone') ||
                transcript.includes('hurts') ||
                transcript.includes('pain') ||
                transcript.includes('please help') ||
                transcript.includes('somebody help') ||
                transcript.includes('cannot get up') ||
                transcript.includes("can't get up") ||
                transcript.includes('doctor') ||
                transcript.includes('ambulance') ||
                transcript.includes('fell down') ||
                transcript.includes('fall')
              ) {
                this.triggerVoiceDistressAlert(transcript);
              }
            }
          }
        };

        recognizer.onerror = (err: any) => {
          if (err.error !== 'no-speech') {
            console.warn('[SeniorMonitor] Speech recognition error:', err.error);
          }
          // Resilient auto-restart for uninterrupted 24/7 hands-free operation
          setTimeout(() => {
            if (this.isListeningVoiceHelp) {
              try {
                recognizer.start();
              } catch {}
            }
          }, 800);
        };

        recognizer.onend = () => {
          // Automatically restart to keep hands-free guardian listening 24/7
          if (this.isListeningVoiceHelp) {
            setTimeout(() => {
              try {
                recognizer.start();
              } catch {}
            }, 300);
          }
        };

        recognizer.start();
        this.speechRecognizer = recognizer;
      } catch (e) {
        console.warn('[SeniorMonitor] Speech recognition initialization failed:', e);
      }
    }

    // Audio level peak detector fallback (e.g. scream / distress shout)
    this.startAudioLevelDetection();
  }

  /**
   * Fallback audio level peak detection (loud scream or crash)
   */
  private async startAudioLevelDetection() {
    try {
      if (this.audioCtx) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (!stream) return;
      this.micStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      let highVolumeCount = 0;

      this.audioMonitorInterval = setInterval(() => {
        if (!this.analyser || !this.isListeningVoiceHelp) return;
        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;

        // Decibel surge detection (loud sudden cry/crash > threshold)
        if (avg > 90) {
          highVolumeCount++;
          if (highVolumeCount >= 3 && !this.isEmergencyActive) {
            highVolumeCount = 0;
            this.triggerSoundSurgeAlert('Sudden high-volume distress scream or impact sound detected.');
          }
        } else {
          highVolumeCount = 0;
        }
      }, 300);
    } catch (e) {
      console.warn('[SeniorMonitor] Audio fallback listener setup skipped:', e);
    }
  }

  /**
   * Trigger sound surge alert
   */
  public triggerSoundSurgeAlert(msg: string) {
    if (this.isEmergencyActive) return;
    this.isEmergencyActive = true;
    const alertData: SeniorAlertData = {
      type: 'sound_surge',
      source: 'Room Acoustic Sensor (Hands-Free)',
      message: msg,
      timestamp: Date.now(),
    };
    speakSeniorVoice('Loud distress sound detected. Alerting family now.');
    playEmergencyAlarmSiren(1);
    globalStreamChannel.sendRemoteCommand('SOUND_SURGE_TRIGGERED', 'all', alertData);
    this.alertListeners.forEach((cb) => cb(alertData));
  }

  /**
   * Hands-free clearing of alerts when senior says "I am okay" or "False alarm"
   */
  public clearSeniorAlerts(phrase: string = 'I am okay') {
    this.fallConfirmed = false;
    this.potentialFallDetectedAt = null;
    this.isEmergencyActive = false;

    const alertData: SeniorAlertData = {
      type: 'alert_cleared',
      keyword: phrase,
      source: 'Senior Spoken Confirmation',
      message: `Senior confirmed hands-free: "${phrase}". Alert canceled.`,
      timestamp: Date.now(),
    };

    speakSeniorVoice('Alert cleared. Family has been informed that you are okay.');
    playWalkieTalkieChirp();
    globalStreamChannel.sendRemoteCommand('SENIOR_OKAY', 'all', alertData);
    this.alertListeners.forEach((cb) => cb(alertData));
  }

  /**
   * Stop hands-free voice listener
   */
  public stopVoiceHelpListener() {
    this.isListeningVoiceHelp = false;
    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch {}
      this.speechRecognizer = null;
    }
  }

  /**
   * Trigger voice distress alert when senior calls out
   */
  public triggerVoiceDistressAlert(detectedPhrase: string = 'Help me') {
    const alertData: SeniorAlertData = {
      type: 'voice_help',
      keyword: detectedPhrase,
      source: 'Room Microphone (Hands-Free VOX)',
      message: `Emergency keyword "${detectedPhrase}" called out by senior in room.`,
      timestamp: Date.now(),
    };

    // 1. Spoken confirmation into room to reassure senior
    speakSeniorVoice('Help alert received. I am alerting your family right now.');

    // 2. Play audible confirmation chirp
    playWalkieTalkieChirp();

    // 3. Broadcast emergency command to all viewer stations (laptops, phones, wall displays)
    globalStreamChannel.sendRemoteCommand('VOICE_HELP_TRIGGERED', 'all', alertData);

    // 4. Notify local listeners
    this.alertListeners.forEach((cb) => cb(alertData));
  }

  /**
   * Trigger fall detected alert
   */
  public triggerFallAlert(details: string = 'Sudden vertical drop followed by floor immobility detected (5+ ft away).') {
    const alertData: SeniorAlertData = {
      type: 'fall_detected',
      source: 'Optical Fall Sensor',
      message: details,
      timestamp: Date.now(),
    };

    // Reassure senior in the room immediately
    speakSeniorVoice('A fall was detected. Are you okay? Help is being notified.');
    playEmergencyAlarmSiren(2);

    // Broadcast to viewer devices
    globalStreamChannel.sendRemoteCommand('FALL_DETECTED', 'all', alertData);

    this.alertListeners.forEach((cb) => cb(alertData));
  }

  /**
   * Optical frame analysis for rapid vertical descent and floor immobility.
   * At 5+ feet away, a standing senior occupies upper/mid frame (Y: 0.1 - 0.5).
   * A fall drops centroid Y to > 0.65 (floor level) in < 1.2s, followed by immobility.
   */
  public processOpticalCentroid(
    centroidY: number, // 0.0 (top of frame) to 1.0 (bottom of frame / floor)
    motionScore: number, // 0 to 100
    hasMotion: boolean
  ) {
    const now = Date.now();

    if (!this.lastCentroidTime) {
      this.lastCentroidY = centroidY;
      this.lastCentroidTime = now;
      return;
    }

    const dt = (now - this.lastCentroidTime) / 1000;
    const dy = centroidY - this.lastCentroidY; // Positive = downward movement

    // Check for rapid downward plunge (standing -> floor)
    if (dt <= 1.5 && dy > 0.35 && centroidY >= 0.6) {
      console.log('[SeniorMonitor] Rapid descent detected! Centroid drop:', dy, 'to floor level:', centroidY);
      this.potentialFallDetectedAt = now;
      this.fallConfirmed = false;
    }

    // Check post-fall immobility on floor (>12 seconds at floor level with low motion)
    if (this.potentialFallDetectedAt && !this.fallConfirmed) {
      const timeSinceDrop = (now - this.potentialFallDetectedAt) / 1000;

      // Senior is still at floor level and motion is low (unmoving or struggling on floor)
      if (centroidY >= 0.55 && motionScore < 25) {
        if (timeSinceDrop >= 12) {
          this.fallConfirmed = true;
          this.potentialFallDetectedAt = null;
          this.triggerFallAlert('Rapid vertical drop followed by 12+ seconds floor immobility.');
        }
      } else if (centroidY < 0.45 && motionScore >= 20) {
        // Senior stood back up! Cancel potential fall alert
        console.log('[SeniorMonitor] Senior stood back up, canceling potential fall alert.');
        this.potentialFallDetectedAt = null;
      }
    }

    this.lastCentroidY = centroidY;
    this.lastCentroidTime = now;
  }

  /**
   * Set Auto-Answer status for intercom
   */
  public setAutoAnswerActive(active: boolean) {
    this.isAutoAnswerActive = active;
  }

  /**
   * Subscribe to senior alerts
   */
  public onSeniorAlert(cb: (alert: SeniorAlertData) => void): () => void {
    this.alertListeners.push(cb);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== cb);
    };
  }

  /**
   * Subscribe to senior speech transcripts (when replying hands-free)
   */
  public onSeniorTranscript(cb: (transcript: string) => void): () => void {
    this.seniorTranscriptListeners.push(cb);
    return () => {
      this.seniorTranscriptListeners = this.seniorTranscriptListeners.filter((l) => l !== cb);
    };
  }
}
