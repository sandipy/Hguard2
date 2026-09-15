import { globalStreamChannel } from './streamChannel';
import { playEmergencyAlarmSiren, playWalkieTalkieChirp, speakSeniorVoice } from './soundAlerts';

export interface SeniorAlertData {
  type: 'fall_detected' | 'voice_help' | 'wandering' | 'sound_surge' | 'alert_cleared';
  keyword?: string;
  source: string;
  message: string;
  timestamp: number;
}

export class SeniorMonitorService {
  private static instance: SeniorMonitorService;
  private isListening = false;
  private speechRecognizer: any = null;
  private alertListeners: ((alert: SeniorAlertData) => void)[] = [];

  public static getInstance(): SeniorMonitorService {
    if (!SeniorMonitorService.instance) {
      SeniorMonitorService.instance = new SeniorMonitorService();
    }
    return SeniorMonitorService.instance;
  }

  public startVoiceHelpListener(onAlertCallback?: (alert: SeniorAlertData) => void) {
    if (this.isListening) return;
    this.isListening = true;
    if (onAlertCallback) {
      this.alertListeners.push(onAlertCallback);
    }

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
              if (
                transcript.includes('i am okay') ||
                transcript.includes("i'm okay") ||
                transcript.includes('cancel alert')
              ) {
                this.clearAlerts(transcript);
                return;
              }
              if (
                transcript.includes('help') ||
                transcript.includes('help me') ||
                transcript.includes('i fell') ||
                transcript.includes('emergency')
              ) {
                this.triggerVoiceHelp(transcript);
              }
            }
          }
        };

        recognizer.onerror = () => {
          setTimeout(() => {
            if (this.isListening) {
              try {
                recognizer.start();
              } catch {}
            }
          }, 1000);
        };

        recognizer.onend = () => {
          if (this.isListening) {
            setTimeout(() => {
              try {
                recognizer.start();
              } catch {}
            }, 500);
          }
        };

        recognizer.start();
        this.speechRecognizer = recognizer;
      } catch (e) {
        console.warn('Speech recognition init skipped:', e);
      }
    }
  }

  public triggerVoiceHelp(phrase: string = 'Help me') {
    const alertData: SeniorAlertData = {
      type: 'voice_help',
      keyword: phrase,
      source: 'Hands-Free Room Microphone',
      message: `Emergency keyword "${phrase}" called out in room.`,
      timestamp: Date.now(),
    };
    speakSeniorVoice('Help alert received. I am contacting family right now.');
    playWalkieTalkieChirp();
    globalStreamChannel.sendCameraCommand({
      command: 'VOICE_HELP_TRIGGERED',
      targetCameraId: 'all',
      payload: alertData,
    });
    this.alertListeners.forEach((cb) => cb(alertData));
  }

  public clearAlerts(phrase: string = 'I am okay') {
    const alertData: SeniorAlertData = {
      type: 'alert_cleared',
      keyword: phrase,
      source: 'Senior Spoken Confirmation',
      message: `Senior confirmed hands-free: "${phrase}". Alert canceled.`,
      timestamp: Date.now(),
    };
    speakSeniorVoice('Alert cleared. Family informed that you are okay.');
    playWalkieTalkieChirp();
    globalStreamChannel.sendCameraCommand({
      command: 'SENIOR_OKAY',
      targetCameraId: 'all',
      payload: alertData,
    });
    this.alertListeners.forEach((cb) => cb(alertData));
  }

  public stopVoiceHelpListener() {
    this.isListening = false;
    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch {}
      this.speechRecognizer = null;
    }
  }
}

export const seniorMonitorService = SeniorMonitorService.getInstance();
