import React, { useState, useEffect, useRef } from 'react';
import styles from './Juno106Synth.module.css';

const Juno106Synth = () => {
  // Audio context and nodes
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const chorusNodesRef = useRef(null);
  const activeNotesRef = useRef({});
  
  // Synth state
  const [power, setPower] = useState(false);
  const [synthParams, setSynthParams] = useState({
    pulseEnabled: true,
    sawEnabled: true,
    subEnabled: false,
    pulseWidth: 50,
    subLevel: 50,
    cutoff: 70,
    resonance: 10,
    envAmount: 50,
    attack: 5,
    decay: 30,
    sustain: 80,
    release: 40,
    chorus: 'off',
    volume: 80
  });

  const [pressedKeys, setPressedKeys] = useState({});
  
  // Note frequencies
  const noteFrequencies = {
    'C': 32.70, 'C#': 34.65, 'D': 36.71, 'D#': 38.89, 'E': 41.20, 'F': 43.65,
    'F#': 46.25, 'G': 49.00, 'G#': 51.91, 'A': 55.00, 'A#': 58.27, 'B': 61.74
  };
  
  // Keyboard layout
  const keyboardMapping = [
    { note: 'C', octave: 3, key: 'a', isBlack: false },
    { note: 'C#', octave: 3, key: 'w', isBlack: true },
    { note: 'D', octave: 3, key: 's', isBlack: false },
    { note: 'D#', octave: 3, key: 'e', isBlack: true },
    { note: 'E', octave: 3, key: 'd', isBlack: false },
    { note: 'F', octave: 3, key: 'f', isBlack: false },
    { note: 'F#', octave: 3, key: 't', isBlack: true },
    { note: 'G', octave: 3, key: 'g', isBlack: false },
    { note: 'G#', octave: 3, key: 'y', isBlack: true },
    { note: 'A', octave: 3, key: 'h', isBlack: false },
    { note: 'A#', octave: 3, key: 'u', isBlack: true },
    { note: 'B', octave: 3, key: 'j', isBlack: false },
    { note: 'C', octave: 4, key: 'k', isBlack: false },
    { note: 'C#', octave: 4, key: 'o', isBlack: true },
    { note: 'D', octave: 4, key: 'l', isBlack: false },
    { note: 'D#', octave: 4, key: 'p', isBlack: true },
    { note: 'E', octave: 4, key: ';', isBlack: false }
  ];

  // Initialize audio
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create master gain
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = synthParams.volume / 100;
      masterGainRef.current.connect(audioContextRef.current.destination);
      
      // Initialize chorus
      initChorus();
    }
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Initialize chorus effect
  const initChorus = () => {
    const ctx = audioContextRef.current;
    
    // Create chorus nodes
    const delay1 = ctx.createDelay();
    delay1.delayTime.value = 0.016;
    
    const delay2 = ctx.createDelay();
    delay2.delayTime.value = 0.022;
    
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.6;
    
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.8;
    
    const lfoGain1 = ctx.createGain();
    lfoGain1.gain.value = 0.002;
    
    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.value = 0.003;
    
    const chorusGain1 = ctx.createGain();
    chorusGain1.gain.value = 0;
    
    const chorusGain2 = ctx.createGain();
    chorusGain2.gain.value = 0;
    
    const directGain = ctx.createGain();
    directGain.gain.value = 1;
    
    // Connect chorus effect
    lfo1.connect(lfoGain1);
    lfo2.connect(lfoGain2);
    
    lfoGain1.connect(delay1.delayTime);
    lfoGain2.connect(delay2.delayTime);
    
    delay1.connect(chorusGain1);
    delay2.connect(chorusGain2);
    
    chorusGain1.connect(masterGainRef.current);
    chorusGain2.connect(masterGainRef.current);
    directGain.connect(masterGainRef.current);
    
    // Start LFOs
    lfo1.start();
    lfo2.start();
    
    // Store chorus nodes
    chorusNodesRef.current = {
      delay1, delay2, chorusGain1, chorusGain2, directGain
    };
  };

  // Calculate frequency for a note
  const getNoteFrequency = (note, octave) => {
    return noteFrequencies[note] * Math.pow(2, octave);
  };

  // Play note
  const playNote = (note, octave) => {
    if (!power || !audioContextRef.current) return;
    
    const noteId = `${note}${octave}`;
    if (activeNotesRef.current[noteId]) return;
    
    const ctx = audioContextRef.current;
    const frequency = getNoteFrequency(note, octave);
    
    // Create filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = (synthParams.cutoff / 100) * 20000;
    filter.Q.value = (synthParams.resonance / 100) * 30;
    
    // Create gain node
    const noteGain = ctx.createGain();
    noteGain.gain.value = 0;
    
    // Create envelope
    const attackTime = (synthParams.attack / 100) * 2;
    const decayTime = (synthParams.decay / 100) * 2;
    const sustainLevel = synthParams.sustain / 100;
    const releaseTime = (synthParams.release / 100) * 3;
    
    // Oscillators
    const oscillators = [];
    
    // Pulse wave
    if (synthParams.pulseEnabled) {
      const pulseOsc = ctx.createOscillator();
      pulseOsc.type = 'square';
      pulseOsc.frequency.value = frequency;
      pulseOsc.connect(filter);
      pulseOsc.start();
      oscillators.push(pulseOsc);
    }
    
    // Sawtooth
    if (synthParams.sawEnabled) {
      const sawOsc = ctx.createOscillator();
      sawOsc.type = 'sawtooth';
      sawOsc.frequency.value = frequency;
      sawOsc.connect(filter);
      sawOsc.start();
      oscillators.push(sawOsc);
    }
    
    // Sub oscillator
    if (synthParams.subEnabled) {
      const subOsc = ctx.createOscillator();
      subOsc.type = 'square';
      subOsc.frequency.value = frequency / 2;
      
      const subGain = ctx.createGain();
      subGain.gain.value = synthParams.subLevel / 100;
      
      subOsc.connect(subGain);
      subGain.connect(filter);
      subOsc.start();
      oscillators.push(subOsc);
    }
    
    // Connect filter to gain
    filter.connect(noteGain);
    
    // Connect to output
    if (synthParams.chorus === 'off') {
      noteGain.connect(chorusNodesRef.current.directGain);
    } else {
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.7;
      noteGain.connect(dryGain);
      dryGain.connect(chorusNodesRef.current.directGain);
      
      if (synthParams.chorus === 'i' || synthParams.chorus === 'ii') {
        chorusNodesRef.current.chorusGain1.gain.value = 0.4;
        noteGain.connect(chorusNodesRef.current.delay1);
      }
      
      if (synthParams.chorus === 'ii') {
        chorusNodesRef.current.chorusGain2.gain.value = 0.4;
        noteGain.connect(chorusNodesRef.current.delay2);
      }
    }
    
    // Apply envelope
    const now = ctx.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.8, now + attackTime);
    noteGain.gain.linearRampToValueAtTime(sustainLevel * 0.8, now + attackTime + decayTime);
    
    // Store note data
    activeNotesRef.current[noteId] = {
      oscillators,
      gain: noteGain,
      filter
    };
  };

  // Release note
  const releaseNote = (note, octave) => {
    const noteId = `${note}${octave}`;
    const noteData = activeNotesRef.current[noteId];
    
    if (noteData && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      const releaseTime = (synthParams.release / 100) * 3;
      
      noteData.gain.gain.cancelScheduledValues(now);
      noteData.gain.gain.setValueAtTime(noteData.gain.gain.value, now);
      noteData.gain.gain.linearRampToValueAtTime(0, now + releaseTime);
      
      noteData.oscillators.forEach(osc => {
        osc.stop(now + releaseTime + 0.1);
      });
      
      setTimeout(() => {
        delete activeNotesRef.current[noteId];
      }, (releaseTime + 0.2) * 1000);
    }
  };

  // Handle parameter changes
  const handleParamChange = (param, value) => {
    setSynthParams(prev => ({ ...prev, [param]: value }));
    
    if (audioContextRef.current) {
      switch (param) {
        case 'volume':
          masterGainRef.current.gain.value = value / 100;
          break;
        case 'chorus':
          if (chorusNodesRef.current) {
            chorusNodesRef.current.chorusGain1.gain.value = value === 'i' || value === 'ii' ? 0.4 : 0;
            chorusNodesRef.current.chorusGain2.gain.value = value === 'ii' ? 0.4 : 0;
          }
          break;
        case 'cutoff':
          Object.values(activeNotesRef.current).forEach(note => {
            note.filter.frequency.value = (value / 100) * 20000;
          });
          break;
        case 'resonance':
          Object.values(activeNotesRef.current).forEach(note => {
            note.filter.Q.value = (value / 100) * 30;
          });
          break;
      }
    }
  };

  // Toggle power
  const togglePower = () => {
    const newPowerState = !power;
    setPower(newPowerState);
    
    if (newPowerState) {
      initAudio();
    } else {
      Object.values(activeNotesRef.current).forEach(note => {
        note.oscillators.forEach(osc => osc.stop());
      });
      activeNotesRef.current = {};
    }
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = keyboardMapping.find(k => k.key === e.key.toLowerCase());
      if (key && !pressedKeys[`${key.note}${key.octave}`]) {
        setPressedKeys(prev => ({ ...prev, [`${key.note}${key.octave}`]: true }));
        playNote(key.note, key.octave);
      }
    };

    const handleKeyUp = (e) => {
      const key = keyboardMapping.find(k => k.key === e.key.toLowerCase());
      if (key) {
        setPressedKeys(prev => {
          const newState = { ...prev };
          delete newState[`${key.note}${key.octave}`];
          return newState;
        });
        releaseNote(key.note, key.octave);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys, power, synthParams]);

  return (
    <div className={styles.synthContainer}>
      <div className={styles.powerControl}>
        <button 
          onClick={togglePower}
          className={`${styles.powerButton} ${power ? styles.powerOn : ''}`}
        >
          POWER {power ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className={styles.controlsSection}>
        {/* DCO Controls */}
        <div className={styles.controlGroup}>
          <h3>DCO</h3>
          <div className={styles.switchRow}>
            <label>
              <input 
                type="checkbox" 
                checked={synthParams.pulseEnabled} 
                onChange={(e) => handleParamChange('pulseEnabled', e.target.checked)}
              />
              Pulse
            </label>
            <label>
              <input 
                type="checkbox"
                checked={synthParams.sawEnabled}
                onChange={(e) => handleParamChange('sawEnabled', e.target.checked)}
              />
              Saw
            </label>
            <label>
              <input 
                type="checkbox"
                checked={synthParams.subEnabled}
                onChange={(e) => handleParamChange('subEnabled', e.target.checked)}
              />
              Sub
            </label>
          </div>
          <div className={styles.sliderContainer}>
            <label>Pulse Width</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.pulseWidth}
              onChange={(e) => handleParamChange('pulseWidth', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Sub Level</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.subLevel}
              onChange={(e) => handleParamChange('subLevel', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* VCF Controls */}
        <div className={styles.controlGroup}>
          <h3>VCF</h3>
          <div className={styles.sliderContainer}>
            <label>Cutoff</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.cutoff}
              onChange={(e) => handleParamChange('cutoff', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Resonance</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.resonance}
              onChange={(e) => handleParamChange('resonance', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Env Amount</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.envAmount}
              onChange={(e) => handleParamChange('envAmount', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* ENV Controls */}
        <div className={styles.controlGroup}>
          <h3>ENVELOPE</h3>
          <div className={styles.sliderContainer}>
            <label>Attack</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.attack}
              onChange={(e) => handleParamChange('attack', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Decay</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.decay}
              onChange={(e) => handleParamChange('decay', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Sustain</label>
            <input 
              type="range" 
              min="0" 
              max="100"
              value={synthParams.sustain}
              onChange={(e) => handleParamChange('sustain', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.sliderContainer}>
            <label>Release</label>
            <input 
              type="range" 
              min="0" 
              max="100"
	                   value={synthParams.release}
              onChange={(e) => handleParamChange('release', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* CHORUS & MASTER */}
        <div className={styles.controlGroup}>
          <h3>CHORUS</h3>
          <select
            value={synthParams.chorus}
            onChange={(e) => handleParamChange('chorus', e.target.value)}
            className={styles.chorusSelect}
          >
            <option value="off">Off</option>
            <option value="i">I</option>
            <option value="ii">II</option>
          </select>

          <div className={styles.sliderContainer}>
            <label>Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={synthParams.volume}
              onChange={(e) => handleParamChange('volume', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* KEYBOARD */}
      <div className={styles.keyboard}>
        {keyboardMapping.map((key) => (
          <div
            key={`${key.note}${key.octave}`}
            className={`${styles.key} ${key.isBlack ? styles.blackKey : styles.whiteKey} ${
              pressedKeys[`${key.note}${key.octave}`] ? styles.activeKey : ''
            }`}
            onMouseDown={() => {
              setPressedKeys(prev => ({ ...prev, [`${key.note}${key.octave}`]: true }));
              playNote(key.note, key.octave);
            }}
            onMouseUp={() => {
              setPressedKeys(prev => {
                const newState = { ...prev };
                delete newState[`${key.note}${key.octave}`];
                return newState;
              });
              releaseNote(key.note, key.octave);
            }}
            onMouseLeave={() => {
              if (pressedKeys[`${key.note}${key.octave}`]) {
                setPressedKeys(prev => {
                  const newState = { ...prev };
                  delete newState[`${key.note}${key.octave}`];
                  return newState;
                });
                releaseNote(key.note, key.octave);
              }
            }}
          >
            <span className={styles.keyLabel}>{key.key.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Juno106Synth;