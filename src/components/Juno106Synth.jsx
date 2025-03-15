const Juno106Synth = () => {
    // ... (keep all existing code)
  
    // Keyboard event handlers
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
  
    // JSX structure
    return (
      <div className="synth-container">
        <div className="power-control">
          <button onClick={togglePower} className={power ? 'on' : 'off'}>
            POWER {power ? 'ON' : 'OFF'}
          </button>
        </div>
  
        <div className="controls-section">
          {/* DCO Controls */}
          <div className="control-group">
            <h3>DCO</h3>
            <div className="switch-row">
              <label>
                <input type="checkbox" 
                  checked={synthParams.pulseEnabled} 
                  onChange={(e) => handleParamChange('pulseEnabled', e.target.checked)}
                />
                Pulse
              </label>
              <label>
                <input type="checkbox"
                  checked={synthParams.sawEnabled}
                  onChange={(e) => handleParamChange('sawEnabled', e.target.checked)}
                />
                Saw
              </label>
              <label>
                <input type="checkbox"
                  checked={synthParams.subEnabled}
                  onChange={(e) => handleParamChange('subEnabled', e.target.checked)}
                />
                Sub
              </label>
            </div>
            <div className="slider-container">
              <label>Pulse Width</label>
              <input type="range" min="0" max="100"
                value={synthParams.pulseWidth}
                onChange={(e) => handleParamChange('pulseWidth', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Sub Level</label>
              <input type="range" min="0" max="100"
                value={synthParams.subLevel}
                onChange={(e) => handleParamChange('subLevel', parseInt(e.target.value))}
              />
            </div>
          </div>
  
          {/* VCF Controls */}
          <div className="control-group">
            <h3>VCF</h3>
            <div className="slider-container">
              <label>Cutoff</label>
              <input type="range" min="0" max="100"
                value={synthParams.cutoff}
                onChange={(e) => handleParamChange('cutoff', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Resonance</label>
              <input type="range" min="0" max="100"
                value={synthParams.resonance}
                onChange={(e) => handleParamChange('resonance', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Env Amount</label>
              <input type="range" min="0" max="100"
                value={synthParams.envAmount}
                onChange={(e) => handleParamChange('envAmount', parseInt(e.target.value))}
              />
            </div>
          </div>
  
          {/* ENV Controls */}
          <div className="control-group">
            <h3>ENVELOPE</h3>
            <div className="slider-container">
              <label>Attack</label>
              <input type="range" min="0" max="100"
                value={synthParams.attack}
                onChange={(e) => handleParamChange('attack', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Decay</label>
              <input type="range" min="0" max="100"
                value={synthParams.decay}
                onChange={(e) => handleParamChange('decay', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Sustain</label>
              <input type="range" min="0" max="100"
                value={synthParams.sustain}
                onChange={(e) => handleParamChange('sustain', parseInt(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Release</label>
              <input type="range" min="0" max="100"
                value={synthParams.release}
                onChange={(e) => handleParamChange('release', parseInt(e.target.value))}
              />
            </div>
          </div>
  
          {/* Chorus & Master */}
          <div className="control-group">
            <h3>CHORUS</h3>
            <select value={synthParams.chorus}
              onChange={(e) => handleParamChange('chorus', e.target.value)}
            >
              <option value="off">Off</option>
              <option value="i">I</option>
              <option value="ii">II</option>
            </select>
  
            <div className="slider-container">
              <label>Volume</label>
              <input type="range" min="0" max="100"
                value={synthParams.volume}
                onChange={(e) => handleParamChange('volume', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
  
        {/* Keyboard */}
        <div className="keyboard">
          {keyboardMapping.map((key) => (
            <div
              key={`${key.note}${key.octave}`}
              className={`key ${key.isBlack ? 'black' : 'white'} ${
                pressedKeys[`${key.note}${key.octave}`] ? 'active' : ''
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
              <span className="key-label">{key.key.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Add CSS styles
  const styles = `
    .synth-container {
      font-family: Arial, sans-serif;
      background: #2a2a2a;
      padding: 20px;
      border-radius: 10px;
      color: white;
      max-width: 800px;
      margin: 0 auto;
    }
  
    .power-control {
      margin-bottom: 20px;
    }
  
    .power-control button {
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  
    .power-control button.on {
      background: #4CAF50;
      color: white;
    }
  
    .power-control button.off {
      background: #666;
      color: #ccc;
    }
  
    .controls-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
  
    .control-group {
      background: #333;
      padding: 15px;
      border-radius: 8px;
    }
  
    .slider-container {
      margin: 10px 0;
    }
  
    .slider-container input[type="range"] {
      width: 100%;
    }
  
    .keyboard {
      display: flex;
      position: relative;
      height: 150px;
    }
  
    .key {
      position: relative;
      cursor: pointer;
    }
  
    .white {
      width: 40px;
      height: 150px;
      background: white;
      border: 1px solid #000;
      z-index: 1;
    }
  
    .black {
      width: 24px;
      height: 90px;
      background: #333;
      margin-left: -12px;
      margin-right: -12px;
      z-index: 2;
    }
  
    .active {
      background: #4CAF50 !important;
    }
  
    .key-label {
      position: absolute;
      bottom: 5px;
      width: 100%;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  
    .black .key-label {
      color: white;
    }
  `;
  
  // Add styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
  
  export default Juno106Synth;