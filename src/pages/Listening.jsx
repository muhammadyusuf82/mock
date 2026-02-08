import React, { useEffect, useRef, useState } from 'react';
import './listening.css';
import { useNavigate } from 'react-router-dom';
import listening from '../audio/listening.mp3'

const Listening = ({ examId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [examStarted, setExamStarted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const baseUrl = 'https://qwertyuiop999.pythonanywhere.com/';

  const [answers, setAnswers] = useState({
    part1: {
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: ''
    },
    part2: {
      q11: '', q12: '', q13: '', q14: '', q15: '', q16: '', 
      q17: '', q18: '', q19: '', q20: ''
    },
    part3: {
      q21: '',
      q22: [],
      q23: [],
      q24: [],
      q25: [],
      q26: '', q27: '', q28: '', q29: '', q30: ''
    },
    part4: {
      q31: '', q32: '', q33: '', q34: '', q35: '', q36: '', q37: '', q38: '', q39: '', q40: ''
    }
  });

  const getAccessToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      throw new Error('No access token found. Please login first.');
    }
    return token;
  };

  useEffect(() => {
    const startExam = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        
        const response = await fetch(`${baseUrl}exam/exams/${examId}/start-listening/`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            navigate('/');
            return;
          }
          throw new Error(errorData.detail || 'Failed to start exam');
        }

        setExamStarted(true);
        setSuccess('Exam started! You have 30 minutes.');
        
        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              autoSubmitAnswers();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
        
      } catch (err) {
        setError(err.message || 'Failed to start exam. Please try again.');
        console.error('Start exam error:', err);
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAnswersForBackend = () => {
    const formatted = {};
    
    Object.keys(answers.part1).forEach((key, index) => {
      formatted[(index + 1).toString()] = answers.part1[key] || '';
    });
    
    Object.keys(answers.part2).forEach((key, index) => {
      formatted[(11 + index).toString()] = answers.part2[key] || '';
    });
    
    formatted['21'] = answers.part3.q21 || '';
    formatted['22'] = answers.part3.q22[0] || '';
    formatted['23'] = answers.part3.q22[1] || '';
    formatted['24'] = answers.part3.q24[0] || '';
    formatted['25'] = answers.part3.q24[1] || '';
    
    formatted['26'] = answers.part3.q26 || '';
    formatted['27'] = answers.part3.q27 || '';
    formatted['28'] = answers.part3.q28 || '';
    formatted['29'] = answers.part3.q29 || '';
    formatted['30'] = answers.part3.q30 || '';
    
    Object.keys(answers.part4).forEach((key, index) => {
      formatted[(31 + index).toString()] = answers.part4[key] || '';
    });
    
    return formatted;
  };

  const submitAnswers = async (autoSubmit = false) => {
    try {
      setSubmitting(true);
      setError('');
      
      const token = getAccessToken();
      const formattedAnswers = formatAnswersForBackend();
      
      console.log('Submitting answers:', formattedAnswers);
      
      const response = await fetch(`${baseUrl}exam/exams/${examId}/finish-listening/`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedAnswers)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit answers');
      }

      const result = await response.json();
      console.log('Submission result:', result);
      
      if (autoSubmit) {
        setSuccess('Time\'s up! Your answers have been auto-submitted.');
        setTimeout(() => {
          navigate('/reading');
        }, 3000);
      } else {
        setSuccess('Answers submitted successfully! Redirecting to Reading section...');
        setTimeout(() => {
          navigate('/reading');
        }, 2000);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to submit answers. Please try again.');
      console.error('Submit answers error:', err);
      setSubmitting(false);
    }
  };

  const autoSubmitAnswers = () => {
    submitAnswers(true);
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your answers? You cannot change them after submission.')) {
      submitAnswers(false);
    }
  };

  const handlePart1Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      part1: {
        ...prev.part1,
        [question]: value.slice(0, 30)
      }
    }));
  };

  const handlePart2Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      part2: {
        ...prev.part2,
        [question]: value
      }
    }));
  };

  const handlePart3SingleChoice = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      part3: {
        ...prev.part3,
        [question]: value
      }
    }));
  };

  const handlePart3MultiChoice = (question, option) => {
    setAnswers(prev => {
      const currentArray = prev.part3[question];
      const newArray = currentArray.includes(option)
        ? currentArray.filter(item => item !== option)
        : [...currentArray, option].slice(0, 2);
      
      return {
        ...prev,
        part3: {
          ...prev.part3,
          [question]: newArray
        }
      };
    });
  };

  const handlePart4Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      part4: {
        ...prev.part4,
        [question]: value.slice(0, 30)
      }
    }));
  };

  const clearAllAnswers = () => {
    if (window.confirm('Are you sure you want to clear all answers?')) {
      setAnswers({
        part1: Object.keys(answers.part1).reduce((acc, key) => ({...acc, [key]: ''}), {}),
        part2: Object.keys(answers.part2).reduce((acc, key) => ({...acc, [key]: ''}), {}),
        part3: Object.keys(answers.part3).reduce((acc, key) => ({...acc, [key]: key.includes('q2') ? [] : ''}), {}),
        part4: Object.keys(answers.part4).reduce((acc, key) => ({...acc, [key]: ''}), {})
      });
      setSuccess('All answers cleared.');
    }
  };

  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.log("Autoplay was prevented. Interaction required:", error);
      });
    }
  }, []);

  return (
    <div className="ielts-container">
      {/* Header Section */}
      <header className="ielts-header">
        <div className="header-left">
          <h1 className="exam-title">IELTS Listening Test</h1>
          <div className="timer-section">
            <div className="timer-icon">⏱️</div>
            <div className="timer-text">
              <span className="timer-label">Time Remaining</span>
              <span className="timer-display">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 bg-slate-100 rounded-lg shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-600 animate-pulse">
            Audio playing...
          </span>
          <audio ref={audioRef} src={listening}>
            Your browser does not support the audio element.
          </audio>
        </div>

        <div className="header-right">
          <div className="action-buttons">
            <button 
              onClick={clearAllAnswers} 
              className="action-btn clear-btn"
              disabled={loading || submitting}
            >
              <span className="btn-icon">🗑️</span>
              Clear All
            </button>
            <button 
              onClick={handleSubmit} 
              className="action-btn submit-btn"
              disabled={submitting || loading}
            >
              <span className="btn-icon">📤</span>
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {error && (
        <div className="status-message error">
          <div className="message-icon">⚠️</div>
          <div className="message-content">{error}</div>
        </div>
      )}

      {success && (
        <div className="status-message success">
          <div className="message-icon">✅</div>
          <div className="message-content">{success}</div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Starting your Listening test...</p>
            <p className="loading-subtext">Please wait while we prepare your exam</p>
          </div>
        </div>
      )}

      {/* Main Content - Single Panel */}
      <main className="main-content single-panel">
        {/* Questions Panel with Integrated Answer Fields */}
        <div className="questions-panel full-width">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="title-icon">🎧</span>
              Listening Test Questions
            </h2>
            <div className="panel-badge">
              <span className="badge-text">Part 1-4</span>
              <span className="badge-count">40 Questions</span>
            </div>
          </div>

          <div className="panel-content">
            {/* Part 1 */}
            <section className="test-section part-section">
              <div className="section-header">
                <div className="section-number">01</div>
                <div className="section-info">
                  <h3>Part 1: Questions 1-10</h3>
                  <p className="section-subtitle">Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.</p>
                </div>
              </div>

              <div className="section-content">
                <div className="hotel-table-container">
                  <table className="hotel-table">
                    <thead>
                      <tr>
                        <th>Hotel Name</th>
                        <th>Location</th>
                        <th>Cost</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="hotel-name">Belvedere Gardens Hotel</td>
                        <td>Example: opposite Grimes Tower</td>
                        <td>
                          $50 per night including<br />
                          <input
                            type="text"
                            value={answers.part1.q1}
                            onChange={(e) => handlePart1Change('q1', e.target.value)}
                            placeholder="Answer 1"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={answers.part1.q2}
                            onChange={(e) => handlePart1Change('q2', e.target.value)}
                            placeholder="Answer 2"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          /><br />
                          breakfast<br />
                          served each evening
                        </td>
                      </tr>
                      <tr>
                        <td className="hotel-name">Belfield Grande</td>
                        <td>
                          On the south side of Edgeware<br />
                          <input
                            type="text"
                            value={answers.part1.q3}
                            onChange={(e) => handlePart1Change('q3', e.target.value)}
                            placeholder="Answer 3"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />
                        </td>
                        <td>
                          $55 per night ($10 discount if<br />
                          <input
                            type="text"
                            value={answers.part1.q4}
                            onChange={(e) => handlePart1Change('q4', e.target.value)}
                            placeholder="Answer 4"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />)<br />
                          price inclusive of
                        </td>
                        <td>
                          <input
                            type="text"
                            value={answers.part1.q5}
                            onChange={(e) => handlePart1Change('q5', e.target.value)}
                            placeholder="Answer 5"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          /><br />
                          served in the<br />
                          <input
                            type="text"
                            value={answers.part1.q6}
                            onChange={(e) => handlePart1Change('q6', e.target.value)}
                            placeholder="Answer 6"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            type="text"
                            value={answers.part1.q7}
                            onChange={(e) => handlePart1Change('q7', e.target.value)}
                            placeholder="Answer 7"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          /><br />
                          Hotel
                        </td>
                        <td>
                          At the entrance to the<br />
                          <input
                            type="text"
                            value={answers.part1.q8}
                            onChange={(e) => handlePart1Change('q8', e.target.value)}
                            placeholder="Answer 8"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          /><br />
                          zone
                        </td>
                        <td>
                          $28 weekdays and $40 on weekends<br />
                          and<br />
                          <input
                            type="text"
                            value={answers.part1.q9}
                            onChange={(e) => handlePart1Change('q9', e.target.value)}
                            placeholder="Answer 9"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />
                        </td>
                        <td>
                          must book<br />
                          well<br />
                          <input
                            type="text"
                            value={answers.part1.q10}
                            onChange={(e) => handlePart1Change('q10', e.target.value)}
                            placeholder="Answer 10"
                            className="answer-input inline-input"
                            disabled={submitting}
                            maxLength={30}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Part 2 */}
            <section className="test-section part-section">
              <div className="section-header">
                <div className="section-number">02</div>
                <div className="section-info">
                  <h3>Part 2: Questions 11-20</h3>
                  <p className="section-subtitle">Questions 11-16: Label the map. Questions 17-20: Multiple choice.</p>
                </div>
              </div>

              <div className="section-content">
                <div className="map-container">
                  <div className="map-title">King's Cross Station Map</div>
                  <div className="map-placeholder">
                    <div className="station-map">
                      [Station Map Image]
                    </div>
                    <div className="map-legend">
                      <div className="legend-item">
                        <span className="legend-marker">📍</span>
                        <span className="legend-label">11. Left Luggage office: </span>
                        <input
                          type="text"
                          value={answers.part2.q11}
                          onChange={(e) => handlePart2Change('q11', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                      <div className="legend-item">
                        <span className="legend-marker">🚇</span>
                        <span className="legend-label">12. Underground station: </span>
                        <input
                          type="text"
                          value={answers.part2.q12}
                          onChange={(e) => handlePart2Change('q12', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                      <div className="legend-item">
                        <span className="legend-marker">🍔</span>
                        <span className="legend-label">13. Burgerland: </span>
                        <input
                          type="text"
                          value={answers.part2.q13}
                          onChange={(e) => handlePart2Change('q13', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                      <div className="legend-item">
                        <span className="legend-marker">🎫</span>
                        <span className="legend-label">14. Ticket office: </span>
                        <input
                          type="text"
                          value={answers.part2.q14}
                          onChange={(e) => handlePart2Change('q14', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                      <div className="legend-item">
                        <span className="legend-marker">🍕</span>
                        <span className="legend-label">15. Pizzeria: </span>
                        <input
                          type="text"
                          value={answers.part2.q15}
                          onChange={(e) => handlePart2Change('q15', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                      <div className="legend-item">
                        <span className="legend-marker">🚂</span>
                        <span className="legend-label">16. Platform 9¾: </span>
                        <input
                          type="text"
                          value={answers.part2.q16}
                          onChange={(e) => handlePart2Change('q16', e.target.value)}
                          placeholder="Your answer"
                          className="answer-input small-input"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mcq-container">
                  <h4 className="mcq-title">Questions 17-20: Multiple Choice</h4>
                  
                  {/* Question 17 */}
                  <div className="mcq-item">
                    <p className="mcq-question">17. The tour is going to</p>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <label key={option} className="mcq-option-radio">
                          <input
                            type="radio"
                            name="q17"
                            value={option}
                            checked={answers.part2.q17 === option}
                            onChange={(e) => handlePart2Change('q17', e.target.value)}
                            disabled={submitting}
                          />
                          <span className="option-letter">{option}</span>
                          <span className="option-text">
                            {option === 'A' && "visit all major London landmarks."}
                            {option === 'B' && "only visit selected landmarks in London."}
                            {option === 'C' && "be a leisurely tour of most London landmarks."}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 18 */}
                  <div className="mcq-item">
                    <p className="mcq-question">18. Tour members</p>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <label key={option} className="mcq-option-radio">
                          <input
                            type="radio"
                            name="q18"
                            value={option}
                            checked={answers.part2.q18 === option}
                            onChange={(e) => handlePart2Change('q18', e.target.value)}
                            disabled={submitting}
                          />
                          <span className="option-letter">{option}</span>
                          <span className="option-text">
                            {option === 'A' && "may be unfamiliar with the Underground."}
                            {option === 'B' && "are all equally familiar with the Underground."}
                            {option === 'C' && "are all unfamiliar with the Underground."}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 19 */}
                  <div className="mcq-item">
                    <p className="mcq-question">19. The tour group is intending to</p>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <label key={option} className="mcq-option-radio">
                          <input
                            type="radio"
                            name="q19"
                            value={option}
                            checked={answers.part2.q19 === option}
                            onChange={(e) => handlePart2Change('q19', e.target.value)}
                            disabled={submitting}
                          />
                          <span className="option-letter">{option}</span>
                          <span className="option-text">
                            {option === 'A' && "take a morning train."}
                            {option === 'B' && "avoid trains crowded with shoppers."}
                            {option === 'C' && "avoid the rush hour."}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 20 */}
                  <div className="mcq-item">
                    <p className="mcq-question">20. Seating on Underground trains</p>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <label key={option} className="mcq-option-radio">
                          <input
                            type="radio"
                            name="q20"
                            value={option}
                            checked={answers.part2.q20 === option}
                            onChange={(e) => handlePart2Change('q20', e.target.value)}
                            disabled={submitting}
                          />
                          <span className="option-letter">{option}</span>
                          <span className="option-text">
                            {option === 'A' && "has been previously reserved."}
                            {option === 'B' && "can be guaranteed for those with a disability."}
                            {option === 'C' && "is never guaranteed"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Part 3 */}
            <section className="test-section part-section">
              <div className="section-header">
                <div className="section-number">03</div>
                <div className="section-info">
                  <h3>Part 3: Questions 21-30</h3>
                  <p className="section-subtitle">Multiple choice and matching questions.</p>
                </div>
              </div>

              <div className="section-content">
                <div className="mcq-container">
                  {/* Question 21 */}
                  <div className="mcq-item">
                    <p className="mcq-question">21. The construction of the new faculty building will</p>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <label key={option} className="mcq-option-radio">
                          <input
                            type="radio"
                            name="q21"
                            value={option}
                            checked={answers.part3.q21 === option}
                            onChange={(e) => handlePart3SingleChoice('q21', e.target.value)}
                            disabled={submitting}
                          />
                          <span className="option-letter">{option}</span>
                          <span className="option-text">
                            {option === 'A' && "finish during the summer."}
                            {option === 'B' && "conclude during the first term."}
                            {option === 'C' && "be approved during the summer."}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Questions 22-23 */}
                  <div className="mcq-item">
                    <p className="mcq-question">Questions 22-23. The two main sources of funding for the project were</p>
                    <div className="mcq-options multiple-select">
                      {['A', 'B', 'C', 'D', 'E'].map(option => (
                        <label key={option} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={answers.part3.q22.includes(option)}
                            onChange={() => handlePart3MultiChoice('q22', option)}
                            disabled={submitting || (answers.part3.q22.length >= 2 && !answers.part3.q22.includes(option))}
                          />
                          <span className="checkbox-label">{option}</span>
                          <span className="checkbox-text">
                            {option === 'A' && "government money"}
                            {option === 'B' && "a college grant"}
                            {option === 'C' && "alumni donations"}
                            {option === 'D' && "the commerce faculty"}
                            {option === 'E' && "an unnamed patron"}
                          </span>
                        </label>
                      ))}
                      <div className="selection-info">
                        Selected: <span className="selected-items">{answers.part3.q22.join(', ') || 'None'}</span>
                        <span className="selection-count">({answers.part3.q22.length}/2)</span>
                      </div>
                    </div>
                    <p className="instruction-note">Select TWO letters</p>
                  </div>

                  {/* Questions 24-25 */}
                  <div className="mcq-item">
                    <p className="mcq-question">Questions 24-25. What two new items are added to the plans?</p>
                    <div className="mcq-options multiple-select">
                      {['A', 'B', 'C', 'D', 'E'].map(option => (
                        <label key={option} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={answers.part3.q24.includes(option)}
                            onChange={() => handlePart3MultiChoice('q24', option)}
                            disabled={submitting || (answers.part3.q24.length >= 2 && !answers.part3.q24.includes(option))}
                          />
                          <span className="checkbox-label">{option}</span>
                          <span className="checkbox-text">
                            {option === 'A' && "a larger gym"}
                            {option === 'B' && "a relaxation room"}
                            {option === 'C' && "a computer lab"}
                            {option === 'D' && "a hardware zone"}
                            {option === 'E' && "lecture rooms"}
                          </span>
                        </label>
                      ))}
                      <div className="selection-info">
                        Selected: <span className="selected-items">{answers.part3.q24.join(', ') || 'None'}</span>
                        <span className="selection-count">({answers.part3.q24.length}/2)</span>
                      </div>
                    </div>
                    <p className="instruction-note">Select TWO letters</p>
                  </div>

                  <div className="table-container">
                    <p className="table-title">Questions 26-30. What does Melisa decide about the following modules?</p>
                    <table className="module-table">
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>A: She will study it</th>
                          <th>B: She won't study it</th>
                          <th>C: She might study it</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[26, 27, 28, 29, 30].map((num, index) => (
                          <tr key={num}>
                            <td>{num}. {['International Markets', 'Product Placement', 'Organisational Behaviour', 'Managing People', 'Public Relations'][index]}</td>
                            {['A', 'B', 'C'].map(option => (
                              <td key={option}>
                                <label className="table-radio-label">
                                  <input
                                    type="radio"
                                    name={`q${num}`}
                                    value={option}
                                    checked={answers.part3[`q${num}`] === option}
                                    onChange={(e) => handlePart3SingleChoice(`q${num}`, e.target.value)}
                                    disabled={submitting}
                                  />
                                  <span className="table-radio-text">{option}</span>
                                </label>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Part 4 */}
            <section className="test-section part-section">
              <div className="section-header">
                <div className="section-number">04</div>
                <div className="section-info">
                  <h3>Part 4: Questions 31-40</h3>
                  <p className="section-subtitle">Complete the sentences and table.</p>
                </div>
              </div>

              <div className="section-content">
                <div className="sentence-completion">
                  <h4 className="completion-title">Questions 31-32</h4>
                  <p className="completion-text">
                    It seems that personality tests are part of our
                    <input
                      type="text"
                      value={answers.part4.q31}
                      onChange={(e) => handlePart4Change('q31', e.target.value)}
                      placeholder="Answer 31"
                      className="answer-input inline-input"
                      disabled={submitting}
                    />
                    as they fulfil a basic human need to understand motivation.
                  </p>
                  <p className="completion-text">
                    Understanding why we communicate and
                    <input
                      type="text"
                      value={answers.part4.q32}
                      onChange={(e) => handlePart4Change('q32', e.target.value)}
                      placeholder="Answer 32"
                      className="answer-input inline-input"
                      disabled={submitting}
                    />
                    others in the way that we do is revealed by personality tests.
                  </p>
                </div>

                <div className="table-container">
                  <h4 className="table-title">Questions 33-40: Complete the table below</h4>
                  <table className="personality-table">
                    <thead>
                      <tr>
                        <th>Test type</th>
                        <th>What is assessed</th>
                        <th>Who uses it</th>
                        <th>Accuracy</th>
                        <th>Advantages/Disadvantages</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Graphology</strong><br />(Handwriting test)</td>
                        <td>handwriting such as style and how letters are formed</td>
                        <td>careers officers/ potential employers</td>
                        <td>
                          believed to have
                          <input
                            type="text"
                            value={answers.part4.q33}
                            onChange={(e) => handlePart4Change('q33', e.target.value)}
                            placeholder="Answer 33"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          by the British Psychological Society
                        </td>
                        <td>
                          can be biased by a/an
                          <input
                            type="text"
                            value={answers.part4.q34}
                            onChange={(e) => handlePart4Change('q34', e.target.value)}
                            placeholder="Answer 34"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          subjectivity: however, on the plus side, it is quick and easy to use
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Rorschach</strong><br />(Ink blot test)</td>
                        <td>individual reactions to a series of ink blots on pieces of card</td>
                        <td>
                          respected
                          <input
                            type="text"
                            value={answers.part4.q35}
                            onChange={(e) => handlePart4Change('q35', e.target.value)}
                            placeholder="Answer 35"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          like the Tavistock Clinic
                        </td>
                        <td>critics regard it merely as a pseudoscience whilst others hold it in high regard</td>
                        <td>
                          a major problem of the test is that it is affected by
                          <input
                            type="text"
                            value={answers.part4.q36}
                            onChange={(e) => handlePart4Change('q36', e.target.value)}
                            placeholder="Answer 36"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Luscher</strong><br />(Colour test)</td>
                        <td>
                          individual response to
                          <input
                            type="text"
                            value={answers.part4.q37}
                            onChange={(e) => handlePart4Change('q37', e.target.value)}
                            placeholder="Answer 37"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          that are ranked in order of preference
                        </td>
                        <td>doctors, psychologists, government agencies and universities</td>
                        <td>
                          seemingly a
                          <input
                            type="text"
                            value={answers.part4.q38}
                            onChange={(e) => handlePart4Change('q38', e.target.value)}
                            placeholder="Answer 38"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          of psychological assessment
                        </td>
                        <td>a benefit of the test is that it is sensitive enough to respond to individual mood changes</td>
                      </tr>
                      <tr>
                        <td><strong>TAT</strong><br />(Thematic Apperception Test)</td>
                        <td>
                          how an individual creates stories based on a set of cards featuring
                          <input
                            type="text"
                            value={answers.part4.q39}
                            onChange={(e) => handlePart4Change('q39', e.target.value)}
                            placeholder="Answer 39"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          in ambiguous scenes
                        </td>
                        <td>those working in psychological research and forensic science</td>
                        <td>
                          due to the
                          <input
                            type="text"
                            value={answers.part4.q40}
                            onChange={(e) => handlePart4Change('q40', e.target.value)}
                            placeholder="Answer 40"
                            className="answer-input inline-input"
                            disabled={submitting}
                          />
                          a universally agreed method of scoring and standardised cards, individual comparisons are problematic
                        </td>
                        <td>the fact that it is quick and simple to use is a huge advantage</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="ielts-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="info-label">Exam ID:</span>
            <span className="info-value">{examId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`info-value ${examStarted ? 'active' : 'inactive'}`}>
              {examStarted ? 'In Progress' : 'Loading...'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Time:</span>
            <span className="info-value time">{formatTime(timeRemaining)} remaining</span>
          </div>
        </div>

        <div className="footer-actions">
          <div className="time-warning">
            ⚠️ Test will auto-submit when time expires
          </div>
          <button 
            onClick={handleSubmit}
            className="final-submit-btn"
            disabled={submitting || loading}
          >
            <span className="submit-icon">🚀</span>
            {submitting ? 'Submitting...' : 'Final Submit'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Listening;