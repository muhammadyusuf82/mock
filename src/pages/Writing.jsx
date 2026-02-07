import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './writing.css';

const Writing = ({ examId }) => {
  const navigate = useNavigate();
  
  const [task1Content, setTask1Content] = useState('');
  const [task2Content, setTask2Content] = useState('');
  const [wordCount1, setWordCount1] = useState(0);
  const [wordCount2, setWordCount2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examStarted, setExamStarted] = useState(false);

  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };

  const BASE_URL = 'https://qwertyuiop999.pythonanywhere.com';

  useEffect(() => {
    const startWritingTest = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        
        if (!token) {
          setError('Authentication required. Please log in.');
          navigate('/login');
          return;
        }

        const response = await fetch(`${BASE_URL}/exam/exams/${examId}/start-writing/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to start writing test');
        }

        setExamStarted(true);
        setError('');
        
        loadDraftFromStorage();
        
      } catch (err) {
        setError(err.message || 'Failed to start writing test');
        console.error('Error starting writing test:', err);
      } finally {
        setLoading(false);
      }
    };

    
      startWritingTest();
    
  }, [navigate]);

  const handleTask1Change = (e) => {
    const text = e.target.value;
    setTask1Content(text);
    setWordCount1(countWords(text));
    saveDraftToStorage();
  };

  const handleTask2Change = (e) => {
    const text = e.target.value;
    setTask2Content(text);
    setWordCount2(countWords(text));
    saveDraftToStorage();
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const saveDraftToStorage = () => {
    const draft = {
      task1: task1Content,
      task2: task2Content,
      wordCount1,
      wordCount2,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`writing_draft_${examId}`, JSON.stringify(draft));
  };

  const loadDraftFromStorage = () => {
    const savedDraft = localStorage.getItem(`writing_draft_${examId}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTask1Content(draft.task1 || '');
        setTask2Content(draft.task2 || '');
        setWordCount1(draft.wordCount1 || 0);
        setWordCount2(draft.wordCount2 || 0);
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  };

  const handleSubmit = async () => {
    // No word count validation - user can submit with any number of words
    
    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      
      const response = await fetch(`${BASE_URL}/exam/exams/3/finish-writing/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task1: task1Content,
          task2: task2Content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit writing test');
      }

      localStorage.removeItem(`writing_draft_${examId}`);
      
      alert('Writing test submitted successfully!');
      
      navigate(`/`);
      
    } catch (err) {
      setError(err.message || 'Failed to submit writing test');
      console.error('Error submitting writing test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    saveDraftToStorage();
    alert('Draft saved locally!');
  };

  const handleLeaveExam = async () => {
    if (window.confirm('Are you sure you want to leave the exam? Your progress will be saved locally.')) {
      try {
        const token = getAccessToken();
        
        await fetch(`${BASE_URL}/exam/exams/${examId}/leave/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        saveDraftToStorage();
        navigate('/');
        
      } catch (err) {
        console.error('Error leaving exam:', err);
        saveDraftToStorage();
        navigate('/');
      }
    }
  };

  const task1Image = 'https://via.placeholder.com/400x250/3a506b/ffffff?text=Chart+showing+girls+per+100+boys';

  return (
    <div className="dark-container writing-container">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      <div className="writing-header">
        <h1>IELTS Writing Test</h1>
        <p className="writing-subtitle">Complete both writing tasks</p>
        {examStarted && <div className="exam-status">Exam Started ✓</div>}
      </div>

      <div className="writing-tasks">
        {/* Task 1 */}
        <div className="writing-task task-1">
          <div className="task-header">
            <h2>Writing Task 1</h2>
            <div className="task-info">
              <span className="time-limit">Time: 20 minutes</span>
              <span className="word-limit">Recommended: 150 words</span>
              <span className="word-count">Current: {wordCount1} words</span>
            </div>
          </div>

          <div className="task-instructions">
            <p>
              The chart below shows the number of girls per 100 boys enrolled in 
              different levels of school education.
            </p>
            <p>
              Summarise the information by selecting and reporting the main features,
              and make comparisons where relevant.
            </p>
          </div>

          <div className="task-1-content">
            <div className="task-image-container">
              <img 
                src={task1Image} 
                alt="Writing Task 1 Chart" 
                className="chart-image"
              />
              <p className="image-caption">Number of girls per 100 boys enrolled in different levels of school education</p>
            </div>

            <div className="writing-area task-1-writing">
              <div className="textarea-header">
                <h3>Your Response</h3>
                <div className="word-progress">
                  <div className="word-indicator">
                    {wordCount1} words
                  </div>
                </div>
              </div>
              <textarea
                className="writing-textarea"
                value={task1Content}
                onChange={handleTask1Change}
                placeholder="Type your response here..."
                rows={15}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Task 2 */}
        <div className="writing-task task-2">
          <div className="task-header">
            <h2>Writing Task 2</h2>
            <div className="task-info">
              <span className="time-limit">Time: 40 minutes</span>
              <span className="word-limit">Recommended: 250 words</span>
              <span className="word-count">Current: {wordCount2} words</span>
            </div>
          </div>

          <div className="task-instructions">
            <p>
              Some people believe that capital punishment should not be used. Others,
              however, argue that it should be allowed for the most serious crimes.
            </p>
            <p>
              Discuss both views and give your opinion.
            </p>
          </div>

          <div className="writing-area">
            <div className="textarea-header">
              <h3>Your Response</h3>
              <div className="word-progress">
                <div className="word-indicator">
                  {wordCount2} words
                </div>
              </div>
            </div>
            <textarea
              className="writing-textarea"
              value={task2Content}
              onChange={handleTask2Change}
              placeholder="Type your response here..."
              rows={20}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="writing-footer">
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          // disabled={loading || !examStarted}
        >
          {loading ? 'Submitting...' : 'Submit Writing Test'}
        </button>

        <button 
          className="leave-btn" 
          onClick={handleLeaveExam}
          // disabled={loading}
        >
          Leave Exam
        </button>
      </div>
    </div>
  );
};

export default Writing;