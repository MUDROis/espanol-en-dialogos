/* js/speech.js */
const Speech = {
  isSupported: 'speechSynthesis' in window,
  isRecognitionSupported: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,

  cleanForTTS(text) {
    return text
      .replace(/\/[aoe]s?\b/g, '')
      .replace(/\s*\/\s*[\wáéíóúñü]+(?:\s+[\wáéíóúñü]+)*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  say(text, lang = 'es-ES', rate = 0.72) {
    return new Promise((resolve) => {
      if (!this.isSupported) { resolve(); return; }
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(this.cleanForTTS(text));
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      speechSynthesis.speak(utterance);
    });
  },

  recognize(expectedText, callback) {
    if (!this.isRecognitionSupported) {
      callback(null, 'Распознавание не поддерживается в этом браузере');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new Recognition();
    recognizer.lang = 'es-ES';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;

    recognizer.onresult = (event) => {
      const results = event.results[0];
      const topText = results[0].transcript.toLowerCase().trim();
      const confidence = results[0].confidence;

      const expectedWords = expectedText.toLowerCase().split(/\s+/);
      const recognizedWords = topText.split(/\s+/);
      const matched = expectedWords.filter(w => recognizedWords.some(rw => rw.includes(w) || w.includes(rw)));
      const percent = expectedWords.length > 0 ? Math.round((matched.length / expectedWords.length) * 100) : 0;

      callback(percent, topText);
    };

    recognizer.onerror = () => {
      callback(null, 'Ошибка микрофона. Разрешите доступ к микрофону.');
    };

    recognizer.start();
  }
};
