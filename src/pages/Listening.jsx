import React, { useEffect, useState } from 'react';
import './listening.css';
import { useNavigate } from 'react-router-dom';

const Listening = ({ examId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [examStarted, setExamStarted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQuestions, setShowQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const baseUrl = 'https://qwertyuiop999.pythonanywhere.com/';

  const [answers, setAnswers] = useState({
    part1: {
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: ''
    },
    part2: {
      q11: '', q12: '', q13: '', q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: ''
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowQuestions(true);
        setShowAnswers(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handlePart2SingleChoice = (question, value) => {
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

  const saveAnswersLocally = () => {
    try {
      localStorage.setItem('listeningAnswers', JSON.stringify(answers));
      setSuccess('Answers saved locally.');
    } catch (err) {
      setError('Failed to save answers locally.');
    }
  };

  const toggleQuestions = () => {
    if (isMobile) {
      setShowQuestions(!showQuestions);
      if (!showQuestions && !showAnswers) {
        setShowAnswers(true);
      }
    }
  };

  const toggleAnswers = () => {
    if (isMobile) {
      setShowAnswers(!showAnswers);
      if (!showQuestions && !showAnswers) {
        setShowQuestions(true);
      }
    }
  };

  const showBothPanels = () => {
    if (isMobile) {
      setShowQuestions(true);
      setShowAnswers(true);
    }
  };

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

        <div className="header-right">
          <div className="view-toggle-section">
            <div className="toggle-buttons">
              <button 
                className={`toggle-btn ${showQuestions ? 'active' : ''}`}
                onClick={toggleQuestions}
              >
                <span className="toggle-icon">📝</span>
                Questions
              </button>
              <button 
                className={`toggle-btn ${showAnswers ? 'active' : ''}`}
                onClick={toggleAnswers}
              >
                <span className="toggle-icon">✏️</span>
                Answer Sheet
              </button>
              {isMobile && (
                <button 
                  className="toggle-btn both-btn"
                  onClick={showBothPanels}
                >
                  <span className="toggle-icon">📋</span>
                  Both
                </button>
              )}
            </div>
            <div className="view-status">
              {isMobile ? (
                <span className="status-text">
                  {showQuestions && showAnswers ? 'Both Panels' : 
                   showQuestions ? 'Questions Only' : 'Answer Sheet Only'}
                </span>
              ) : (
                <span className="status-text">Split View - Both panels visible</span>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={saveAnswersLocally} 
              className="action-btn save-btn"
              disabled={loading || submitting}
            >
              <span className="btn-icon">💾</span>
              Save Progress
            </button>
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

      {/* Main Content - Split View */}
      <main className={`main-content ${!showQuestions ? 'answers-only' : ''} ${!showAnswers ? 'questions-only' : ''}`}>
        {/* Questions Panel */}
        {(showQuestions || !isMobile) && (
          <div className={`questions-panel ${!showAnswers && isMobile ? 'full-width' : ''}`}>
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
                            <span className="answer-space">Answer 1</span>
                          </td>
                          <td>
                            <span className="answer-space">Answer 2</span><br />
                            breakfast<br />
                            served each evening
                          </td>
                        </tr>
                        <tr>
                          <td className="hotel-name">Belfield Grande</td>
                          <td>
                            On the south side of Edgeware<br />
                            <span className="answer-space">Answer 3</span>
                          </td>
                          <td>
                            $55 per night ($10 discount if<br />
                            <span className="answer-space">Answer 4</span>)<br />
                            price inclusive of
                          </td>
                          <td>
                            <span className="answer-space">Answer 5</span><br />
                            served in the<br />
                            <span className="answer-space">Answer 6</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="answer-space">Answer 7</span><br />
                            Hotel
                          </td>
                          <td>
                            At the entrance to the<br />
                            <span className="answer-space">Answer 8</span><br />
                            zone
                          </td>
                          <td>
                            $28 weekdays and $40 on weekends<br />
                            and<br />
                            <span className="answer-space">Answer 9</span>
                          </td>
                          <td>
                            must book<br />
                            well<br />
                            <span className="answer-space">Answer 10</span>
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
                          <span className="legend-label">11. Left Luggage office</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-marker">🚇</span>
                          <span className="legend-label">12. Underground station</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-marker">🍔</span>
                          <span className="legend-label">13. Burgerland</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-marker">🎫</span>
                          <span className="legend-label">14. Ticket office</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-marker">🍕</span>
                          <span className="legend-label">15. Pizzeria</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-marker">🚂</span>
                          <span className="legend-label">16. Platform 9¾</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mcq-container">
                    <h4 className="mcq-title">Questions 17-20: Multiple Choice</h4>
                    <div className="mcq-item">
                      <p className="mcq-question">17. The tour is going to</p>
                      <div className="mcq-options">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">visit all major London landmarks.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">only visit selected landmarks in London.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">be a leisurely tour of most London landmarks.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mcq-item">
                      <p className="mcq-question">18. Tour members</p>
                      <div className="mcq-options">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">may be unfamiliar with the Underground.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">are all equally familiar with the Underground.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">are all unfamiliar with the Underground.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mcq-item">
                      <p className="mcq-question">19. The tour group is intending to</p>
                      <div className="mcq-options">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">take a morning train.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">avoid trains crowded with shoppers.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">avoid the rush hour.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mcq-item">
                      <p className="mcq-question">20. Seating on Underground trains</p>
                      <div className="mcq-options">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">has been previously reserved.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">can be guaranteed for those with a disability.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">is never guaranteed</span>
                        </div>
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
                    <div className="mcq-item">
                      <p className="mcq-question">21. The construction of the new faculty building will</p>
                      <div className="mcq-options">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">finish during the summer.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">conclude during the first term.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">be approved during the summer.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mcq-item">
                      <p className="mcq-question">Questions 22-23. The two main sources of funding for the project were</p>
                      <div className="mcq-options multiple-select">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">government money.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">a college grant.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">alumni donations.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">D</span>
                          <span className="option-text">the commerce faculty.</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">E</span>
                          <span className="option-text">an unnamed patron.</span>
                        </div>
                      </div>
                      <p className="instruction-note">Select TWO letters</p>
                    </div>

                    <div className="mcq-item">
                      <p className="mcq-question">Questions 24-25. What two new items are added to the plans?</p>
                      <div className="mcq-options multiple-select">
                        <div className="mcq-option">
                          <span className="option-letter">A</span>
                          <span className="option-text">a larger gym</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">B</span>
                          <span className="option-text">a relaxation room</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">C</span>
                          <span className="option-text">a computer lab</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">D</span>
                          <span className="option-text">a hardware zone</span>
                        </div>
                        <div className="mcq-option">
                          <span className="option-letter">E</span>
                          <span className="option-text">lecture rooms</span>
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
                          <tr>
                            <td>26. International Markets</td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                          </tr>
                          <tr>
                            <td>27. Product Placement</td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                          </tr>
                          <tr>
                            <td>28. Organisational Behaviour</td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                          </tr>
                          <tr>
                            <td>29. Managing People</td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                          </tr>
                          <tr>
                            <td>30. Public Relations</td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                            <td><span className="table-answer">Select</span></td>
                          </tr>
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
                      <span className="answer-space">Answer 31</span>
                      as they fulfil a basic human need to understand motivation.
                    </p>
                    <p className="completion-text">
                      Understanding why we communicate and
                      <span className="answer-space">Answer 32</span>
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
                            <span className="answer-space">Answer 33</span>
                            by the British Psychological Society
                          </td>
                          <td>
                            can be biased by a/an
                            <span className="answer-space">Answer 34</span>
                            subjectivity: however, on the plus side, it is quick and easy to use
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Rorschach</strong><br />(Ink blot test)</td>
                          <td>individual reactions to a series of ink blots on pieces of card</td>
                          <td>
                            respected
                            <span className="answer-space">Answer 35</span>
                            like the Tavistock Clinic
                          </td>
                          <td>critics regard it merely as a pseudoscience whilst others hold it in high regard</td>
                          <td>
                            a major problem of the test is that it is affected by
                            <span className="answer-space">Answer 36</span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Luscher</strong><br />(Colour test)</td>
                          <td>
                            individual response to
                            <span className="answer-space">Answer 37</span>
                            that are ranked in order of preference
                          </td>
                          <td>doctors, psychologists, government agencies and universities</td>
                          <td>
                            seemingly a
                            <span className="answer-space">Answer 38</span>
                            of psychological assessment
                          </td>
                          <td>a benefit of the test is that it is sensitive enough to respond to individual mood changes</td>
                        </tr>
                        <tr>
                          <td><strong>TAT</strong><br />(Thematic Apperception Test)</td>
                          <td>
                            how an individual creates stories based on a set of cards featuring
                            <span className="answer-space">Answer 39</span>
                            in ambiguous scenes
                          </td>
                          <td>those working in psychological research and forensic science</td>
                          <td>
                            due to the
                            <span className="answer-space">Answer 40</span>
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
        )}

        {/* Answer Sheet Panel */}
        {(showAnswers || !isMobile) && (
          <div className={`answers-panel ${!showQuestions && isMobile ? 'full-width' : ''}`}>
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="title-icon">📝</span>
                Answer Sheet
              </h2>
              <div className="panel-badge">
                <span className="badge-text">Auto-save</span>
                <span className="badge-indicator">●</span>
              </div>
            </div>

            <div className="panel-content">
              <div className="answers-navigation">
                <button className="nav-btn active" onClick={() => document.getElementById('part1-answers').scrollIntoView({behavior: 'smooth'})}>
                  Part 1
                </button>
                <button className="nav-btn" onClick={() => document.getElementById('part2-answers').scrollIntoView({behavior: 'smooth'})}>
                  Part 2
                </button>
                <button className="nav-btn" onClick={() => document.getElementById('part3-answers').scrollIntoView({behavior: 'smooth'})}>
                  Part 3
                </button>
                <button className="nav-btn" onClick={() => document.getElementById('part4-answers').scrollIntoView({behavior: 'smooth'})}>
                  Part 4
                </button>
              </div>

              {/* Part 1 Answers */}
              <section id="part1-answers" className="answers-section">
                <div className="answers-header">
                  <h3>Part 1: Questions 1-10</h3>
                  <span className="answers-subtitle">NO MORE THAN TWO WORDS for each answer</span>
                </div>
                
                <div className="answers-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <div key={num} className="answer-item">
                      <label className="answer-label">Q{num}</label>
                      <input
                        type="text"
                        value={answers.part1[`q${num}`]}
                        onChange={(e) => handlePart1Change(`q${num}`, e.target.value)}
                        placeholder="Write your answer..."
                        className="answer-input"
                        disabled={submitting}
                        maxLength={30}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Part 2 Answers */}
              <section id="part2-answers" className="answers-section">
                <div className="answers-header">
                  <h3>Part 2: Questions 11-20</h3>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 11-16: Map Labels</h4>
                  <div className="answers-grid">
                    {[11, 12, 13, 14, 15, 16].map(num => (
                      <div key={num} className="answer-item">
                        <label className="answer-label">Q{num}</label>
                        <input
                          type="text"
                          value={answers.part2[`q${num}`]}
                          onChange={(e) => handlePart2SingleChoice(`q${num}`, e.target.value)}
                          placeholder="Label..."
                          className="answer-input"
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 17-20: Multiple Choice</h4>
                  <div className="mcq-answers">
                    {[17, 18, 19, 20].map(num => (
                      <div key={num} className="mcq-answer">
                        <label className="mcq-label">Q{num}</label>
                        <div className="mcq-options">
                          {['A', 'B', 'C'].map(option => (
                            <button
                              key={option}
                              className={`mcq-option-btn ${answers.part2[`q${num}`] === option ? 'selected' : ''}`}
                              onClick={() => handlePart2SingleChoice(`q${num}`, option)}
                              disabled={submitting}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Part 3 Answers */}
              <section id="part3-answers" className="answers-section">
                <div className="answers-header">
                  <h3>Part 3: Questions 21-30</h3>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Question 21</h4>
                  <div className="single-mcq">
                    <label className="mcq-label">Q21</label>
                    <div className="mcq-options">
                      {['A', 'B', 'C'].map(option => (
                        <button
                          key={option}
                          className={`mcq-option-btn ${answers.part3.q21 === option ? 'selected' : ''}`}
                          onClick={() => handlePart3SingleChoice('q21', option)}
                          disabled={submitting}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 22-23: Select TWO letters</h4>
                  <div className="multi-select">
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
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 24-25: Select TWO letters</h4>
                  <div className="multi-select">
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
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 26-30</h4>
                  <div className="table-answers">
                    {[26, 27, 28, 29, 30].map(num => (
                      <div key={num} className="table-row">
                        <label className="table-label">Q{num}</label>
                        <div className="table-options">
                          {['A', 'B', 'C'].map(option => (
                            <button
                              key={option}
                              className={`table-option-btn ${answers.part3[`q${num}`] === option ? 'selected' : ''}`}
                              onClick={() => handlePart3SingleChoice(`q${num}`, option)}
                              disabled={submitting}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Part 4 Answers */}
              <section id="part4-answers" className="answers-section">
                <div className="answers-header">
                  <h3>Part 4: Questions 31-40</h3>
                  <span className="answers-subtitle">Q31-32: NO MORE THAN TWO WORDS | Q33-40: NO MORE THAN THREE WORDS</span>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 31-32</h4>
                  <div className="answers-grid">
                    {[31, 32].map(num => (
                      <div key={num} className="answer-item">
                        <label className="answer-label">Q{num}</label>
                        <input
                          type="text"
                          value={answers.part4[`q${num}`]}
                          onChange={(e) => handlePart4Change(`q${num}`, e.target.value)}
                          placeholder="Answer..."
                          className="answer-input"
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="answer-group">
                  <h4 className="group-title">Questions 33-40</h4>
                  <div className="answers-grid">
                    {[33, 34, 35, 36, 37, 38, 39, 40].map(num => (
                      <div key={num} className="answer-item">
                        <label className="answer-label">Q{num}</label>
                        <input
                          type="text"
                          value={answers.part4[`q${num}`]}
                          onChange={(e) => handlePart4Change(`q${num}`, e.target.value)}
                          placeholder="Answer..."
                          className="answer-input"
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="answers-footer">
                <div className="progress-summary">
                  <div className="progress-item">
                    <span className="progress-label">Total Questions:</span>
                    <span className="progress-value">40</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Answered:</span>
                    <span className="progress-value answered">
                      {Object.values(answers.part1).filter(a => a).length +
                       Object.values(answers.part2).filter(a => a).length +
                       (answers.part3.q21 ? 1 : 0) +
                       answers.part3.q22.length +
                       answers.part3.q24.length +
                       Object.values(answers.part3).filter((v, i) => i >= 5 && v).length +
                       Object.values(answers.part4).filter(a => a).length}
                    </span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Remaining:</span>
                    <span className="progress-value remaining">
                      {40 - (Object.values(answers.part1).filter(a => a).length +
                       Object.values(answers.part2).filter(a => a).length +
                       (answers.part3.q21 ? 1 : 0) +
                       answers.part3.q22.length +
                       answers.part3.q24.length +
                       Object.values(answers.part3).filter((v, i) => i >= 5 && v).length +
                       Object.values(answers.part4).filter(a => a).length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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