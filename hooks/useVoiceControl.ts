import { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceCommandId, VoiceNoticeTone, VoiceStatus } from '../types';

type VoiceCommandDictionary = Record<VoiceCommandId, string[]>;

const VOICE_COMMANDS: VoiceCommandDictionary = {
  open_document: [
    'открой документ',
    'открыть документ',
  ],
  hide_right_panel: [
    'скрой правую панель',
    'скрыть правую панель',
    'сверни правую панель',
    'свернуть правую панель',
  ],
  set_landscape_orientation: [
    'измени ориентацию документа с вертикальной на горизонтальную',
    'смени ориентацию документа на горизонтальную',
    'переведи документ в горизонтальную ориентацию',
    'сделай документ горизонтальным',
  ],
  show_qc_result: [
    'покажи результат проверки',
    'открой результат проверки',
    'показать результат проверки',
  ],
  lock_workstation: [
    'заблокируй рабочее место',
    'заблокировать рабочее место',
  ],
};

const normalizeVoiceText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[.,!?;:()"'`«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const resolveVoiceCommand = (normalizedText: string): VoiceCommandId | null => {
  const entries = Object.entries(VOICE_COMMANDS) as Array<[VoiceCommandId, string[]]>;

  for (const [commandId, aliases] of entries) {
    if (aliases.some((alias) => normalizedText.includes(alias))) {
      return commandId;
    }
  }

  return null;
};

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: SpeechRecognitionErrorCode;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface UseVoiceControlParams {
  enabled: boolean;
  blocked?: boolean;
  onCommand: (commandId: VoiceCommandId, recognizedText: string) => {
    notice?: {
      message: string;
      tone: VoiceNoticeTone;
    };
  } | void;
  onNotice?: (message: string, tone: VoiceNoticeTone) => void;
}

interface UseVoiceControlResult {
  voiceStatus: VoiceStatus;
  lastRecognizedCommand: string;
  isSupported: boolean;
}

export const useVoiceControl = ({
  enabled,
  blocked = false,
  onCommand,
  onNotice,
}: UseVoiceControlParams): UseVoiceControlResult => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('disabled');
  const [lastRecognizedCommand, setLastRecognizedCommand] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const fatalErrorRef = useRef(false);
  const enabledRef = useRef(enabled);
  const blockedRef = useRef(blocked);
  const prevEnabledRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);
  const onNoticeRef = useRef(onNotice);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const emitNotice = useCallback((message: string, tone: VoiceNoticeTone) => {
    onNoticeRef.current?.(message, tone);
  }, []);

  const stopRecognition = useCallback((manualStop: boolean) => {
    manualStopRef.current = manualStop;
    clearRestartTimer();

    const recognition = recognitionRef.current;
    if (recognition && listeningRef.current) {
      try {
        recognition.stop();
      } catch {
        // no-op
      }
    }
  }, [clearRestartTimer]);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listeningRef.current || !enabledRef.current || blockedRef.current || fatalErrorRef.current) {
      return;
    }

    try {
      recognition.start();
    } catch {
      clearRestartTimer();
      restartTimerRef.current = window.setTimeout(() => {
        if (enabledRef.current && !blockedRef.current && !fatalErrorRef.current) {
          startRecognition();
        }
      }, 650);
    }
  }, [clearRestartTimer]);

  useEffect(() => {
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      recognitionRef.current = null;
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      setVoiceStatus('listening');
    };

    recognition.onresult = (event) => {
      let transcript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result?.isFinal) continue;
        transcript = result[0]?.transcript ?? '';
        break;
      }

      const normalized = normalizeVoiceText(transcript);
      if (!normalized) {
        setVoiceStatus('unknown');
        emitNotice('Команда не распознана', 'warning');
        return;
      }

      setLastRecognizedCommand(normalized);
      setVoiceStatus('recognized');
      emitNotice(`Команда распознана: ${normalized}`, 'info');

      const commandId = resolveVoiceCommand(normalized);
      if (!commandId) {
        setVoiceStatus('unknown');
        emitNotice('Команда не распознана', 'warning');
        return;
      }

      const commandResult = onCommandRef.current(commandId, normalized);
      setVoiceStatus('executed');
      if (commandResult?.notice) {
        emitNotice(commandResult.notice.message, commandResult.notice.tone);
      } else {
        emitNotice('Команда выполнена', 'success');
      }
    };

    recognition.onerror = (event) => {
      if (manualStopRef.current) return;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        fatalErrorRef.current = true;
        setVoiceStatus('mic_unavailable');
        emitNotice('Доступ к микрофону запрещен', 'error');
        return;
      }

      if (event.error === 'audio-capture') {
        fatalErrorRef.current = true;
        setVoiceStatus('mic_unavailable');
        emitNotice('Микрофон недоступен', 'error');
        return;
      }

      if (event.error === 'no-speech') {
        setVoiceStatus('unknown');
        emitNotice('Команда не распознана', 'warning');
        return;
      }

      setVoiceStatus('error');
      emitNotice('Ошибка распознавания', 'error');
    };

    recognition.onend = () => {
      listeningRef.current = false;

      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }

      if (!enabledRef.current || blockedRef.current || fatalErrorRef.current) {
        return;
      }

      setVoiceStatus('idle');
      clearRestartTimer();
      restartTimerRef.current = window.setTimeout(() => {
        startRecognition();
      }, 700);
    };

    recognitionRef.current = recognition;

    return () => {
      stopRecognition(true);
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
  }, [clearRestartTimer, emitNotice, startRecognition, stopRecognition]);

  useEffect(() => {
    enabledRef.current = enabled;
    blockedRef.current = blocked;

    if (enabled && !prevEnabledRef.current) {
      fatalErrorRef.current = false;
    }
    prevEnabledRef.current = enabled;

    if (!enabled) {
      stopRecognition(true);
      setVoiceStatus('disabled');
      return;
    }

    if (!isSupported || !recognitionRef.current) {
      setVoiceStatus('unsupported');
      return;
    }

    if (blocked) {
      stopRecognition(true);
      setVoiceStatus('idle');
      return;
    }

    setVoiceStatus('idle');
    startRecognition();
  }, [blocked, enabled, isSupported, startRecognition, stopRecognition]);

  return {
    voiceStatus,
    lastRecognizedCommand,
    isSupported,
  };
};
