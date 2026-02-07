import React, { useState, useEffect } from 'react';
import './reading.css'
import { useNavigate } from 'react-router-dom';
const Reading = ({ examId }) => {
  const [currentView, setCurrentView] = useState('passage');
  const [currentPassage, setCurrentPassage] = useState(1);

  const navigate = useNavigate()
  
  const [answers, setAnswers] = useState({
    passage1: {
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', 
      q9: '', q10: '', q11: '', q12: '', q13: ''
    },
    passage2: {
      q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: '', q21: '', q22: '',
      q23: [], q24: [], q25: [], q26: []
    },
    passage3: {
      q27: '', q28: '', q29: '', q30: '', q31: '', q32: '', q33: '', q34: '', q35: '',
      q36: '', q37: '', q38: '', q39: '', q40: ''
    }
  });

  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [startAttempted, setStartAttempted] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Get access token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No access token found. Please login first.');
      return;
    }
    setAccessToken(token);
  }, []);

  // Start reading test when component mounts
  useEffect(() => {
    const startTest = async () => {
      if (examId && accessToken && !testStarted && !startAttempted) {
        setStartAttempted(true);
        await startReadingTest();
      }
    };

    if (accessToken) {
      startTest();
    }
  }, [examId, accessToken, testStarted, startAttempted]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (testStarted && !testFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStarted && !testFinished) {
      finishReadingTest();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testStarted, testFinished, timeLeft]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startReadingTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://qwertyuiop999.pythonanywhere.com/exam/exams/3/start-reading/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setStartAttempted(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start reading test: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Reading test started successfully:', data);
      setTestStarted(true);
      setSuccessMessage('Reading test started! You have 60 minutes.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(`Error starting reading test: ${err.message}`);
      console.error('Error starting reading test:', err);
      
      // Reset startAttempted to allow retry
      setStartAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  const flattenAnswers = () => {
    const flatAnswers = {};
    
    // Passage 1: Questions 1-13
    for (let i = 1; i <= 13; i++) {
      const key = `q${i}`;
      const value = answers.passage1[key];
      flatAnswers[i.toString()] = value || '';
    }

    // Passage 2: Questions 14-26
    for (let i = 14; i <= 26; i++) {
      const key = `q${i}`;
      const value = answers.passage2[key];
      if (i >= 23 && i <= 26) {
        // For multiple choice questions (23-26)
        flatAnswers[i.toString()] = Array.isArray(value) ? value.join(',') : '';
      } else {
        flatAnswers[i.toString()] = value || '';
      }
    }

    // Passage 3: Questions 27-40
    for (let i = 27; i <= 40; i++) {
      const key = `q${i}`;
      const value = answers.passage3[key];
      flatAnswers[i.toString()] = value || '';
    }

    return flatAnswers;
  };

  const finishReadingTest = async () => {
    if (!testStarted) {
      setError('Test not started yet. Please wait...');
      return;
    }

    if (testFinished) {
      setError('Test already submitted');
      return;
    }

    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to submit your reading test? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const flattenedAnswers = flattenAnswers();
      
      console.log('Submitting reading answers:', flattenedAnswers);
      
      const response = await fetch(
        `https://qwertyuiop999.pythonanywhere.com/exam/exams/3/finish-reading/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(flattenedAnswers)
        }
      );

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit reading answers: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Reading test submitted successfully:', data);
      setTestFinished(true);
      setError(null);
      setSuccessMessage('✅ Reading test submitted successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/writing')
      }, 5000);
    } catch (err) {
      setError(`Error submitting reading test: ${err.message}`);
      console.error('Error finishing reading test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePassage1Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      passage1: { ...prev.passage1, [question]: value }
    }));
  };

  const handlePassage2Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      passage2: { ...prev.passage2, [question]: value }
    }));
  };

  const handlePassage2MultiChoice = (question, option) => {
    setAnswers(prev => {
      const currentArray = prev.passage2[question];
      let newArray;
      
      if (currentArray.includes(option)) {
        newArray = currentArray.filter(item => item !== option);
      } else {
        newArray = [...currentArray, option];
      }
      
      return {
        ...prev,
        passage2: { ...prev.passage2, [question]: newArray }
      };
    });
  };

  const handlePassage3Change = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      passage3: { ...prev.passage3, [question]: value }
    }));
  };

  const clearAllAnswers = () => {
    if (window.confirm('Are you sure you want to clear all answers?')) {
      setAnswers({
        passage1: Object.fromEntries(Object.keys(answers.passage1).map(key => [key, ''])),
        passage2: Object.fromEntries(Object.keys(answers.passage2).map(key => 
          [key, key.startsWith('q2') && parseInt(key.slice(1)) >= 23 ? [] : '']
        )),
        passage3: Object.fromEntries(Object.keys(answers.passage3).map(key => [key, '']))
      });
      setSuccessMessage('All answers cleared.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const statements = [
    { letter: 'A', text: "In the survey, students could only rate employers on a given list" },
    { letter: 'B', text: "The Environment Agency rose the most places in this year's survey" },
    { letter: 'C', text: "The NHS offers a variety of careers outside health care" },
    { letter: 'D', text: "British Airways fell in popularity amongst business students" },
    { letter: 'E', text: "James Darley was surprised by his organisation's performance in the survey" },
    { letter: 'F', text: "Most Teach First teachers continue in a teaching career after two years" },
    { letter: 'G', text: "Most students want to achieve a good work/life balance" },
    { letter: 'H', text: "Most business students were concerned about working for an ethical company" }
  ];

  const renderTFNGButtons = (question, passage, handler) => {
    const options = [
      { value: 'TRUE', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      { value: 'FALSE', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { value: 'NOT GIVEN', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
    ];
    const currentValue = answers[passage][question];
    
    return (
      <div className="tfng-group">
        {options.map(({ value, color, bg }) => (
          <button
            key={value}
            className={`tfng-option ${currentValue === value ? 'selected' : ''}`}
            onClick={() => handler(question, value)}
            disabled={testFinished || loading || !testStarted}
            style={{
              backgroundColor: currentValue === value ? color : bg,
              color: currentValue === value ? 'white' : color,
              borderColor: currentValue === value ? color : 'transparent'
            }}
          >
            {value}
          </button>
        ))}
      </div>
    );
  };

  const renderParagraphButtons = (question, passage, handler, maxLetter = 'E') => {
    const letters = maxLetter === 'E' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const currentValue = answers[passage][question];
    
    return (
      <div className="letter-group">
        {letters.map(letter => (
          <button
            key={letter}
            className={`letter-option ${currentValue === letter ? 'selected' : ''}`}
            onClick={() => handler(question, letter)}
            disabled={testFinished || loading || !testStarted}
          >
            {letter}
          </button>
        ))}
      </div>
    );
  };

  const getAnswerProgress = () => {
    let answered = 0;
    let total = 0;

    // Passage 1
    Object.values(answers.passage1).forEach(value => {
      total++;
      if (value && value.toString().trim() !== '') answered++;
    });

    // Passage 2
    Object.entries(answers.passage2).forEach(([key, value]) => {
      total++;
      if (key.startsWith('q2') && ['q23', 'q24', 'q25', 'q26'].includes(key)) {
        // Multi-select questions
        if (Array.isArray(value) && value.length > 0) answered++;
      } else {
        // Single answer questions
        if (value && value.toString().trim() !== '') answered++;
      }
    });

    // Passage 3
    Object.values(answers.passage3).forEach(value => {
      total++;
      if (value && value.toString().trim() !== '') answered++;
    });

    return { answered, total };
  };

  const progress = getAnswerProgress();
  const progressPercentage = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;

  // Manual start button for fallback
  const renderStartButton = () => {
    if (!testStarted && !loading && accessToken) {
      return (
        <button 
          onClick={startReadingTest}
          className="start-btn"
          disabled={loading}
        >
          <span className="btn-icon">▶️</span>
          Start Reading Test
        </button>
      );
    }
    return null;
  };

  return (
    <div className="modern-reading-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-top">
          <div className="test-info">
            <h1>IELTS Academic Reading</h1>
            <div className="test-status">
              <span className={`status-badge ${testFinished ? 'submitted' : testStarted ? 'started' : 'not-started'}`}>
                {testFinished ? 'Submitted' : testStarted ? 'In Progress' : 'Not Started'}
              </span>
              <div className="timer">
                <span className="timer-icon">⏱️</span>
                <span className="timer-text">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="view-switcher">
              <button 
                className={`view-btn ${currentView === 'passage' ? 'active' : ''}`}
                onClick={() => setCurrentView('passage')}
                disabled={loading || testFinished || !testStarted}
              >
                📄 Reading Passage
              </button>
              <button 
                className={`view-btn ${currentView === 'questions' ? 'active' : ''}`}
                onClick={() => setCurrentView('questions')}
                disabled={loading || testFinished || !testStarted}
              >
                📝 Answer Questions
              </button>
            </div>
            
            <div className="action-buttons">
              {renderStartButton()}
              <button 
                onClick={finishReadingTest} 
                className="submit-btn"
                disabled={loading || !testStarted || testFinished}
              >
                <span className="btn-icon">✓</span>
                {loading ? 'Submitting...' : 'Submit Reading Test'}
              </button>
              <button 
                onClick={clearAllAnswers} 
                className="clear-btn"
                disabled={loading || testFinished || !testStarted}
              >
                <span className="btn-icon">↺</span>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">Progress: {progress.answered}/{progress.total} questions answered</span>
            <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Passage Navigation */}
        <div className="passage-tabs">
          {[1, 2, 3].map(num => (
            <button
              key={num}
              className={`passage-tab ${currentPassage === num ? 'active' : ''}`}
              onClick={() => setCurrentPassage(num)}
              disabled={loading || testFinished || !testStarted}
            >
              <span className="tab-number">Passage {num}</span>
              <span className="tab-range">
                {num === 1 ? 'Q1-13' : num === 2 ? 'Q14-26' : 'Q27-40'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-alert error">
          <div className="message-content">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            {error.includes('Session expired') && (
              <button 
                onClick={() => window.location.href = '/'}
                className="retry-btn"
                style={{marginLeft: '10px', padding: '4px 8px', fontSize: '12px'}}
              >
                Login Again
              </button>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="message-alert success">
          <div className="message-content">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-modal">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>
              {!testStarted ? 'Starting reading test...' : 
               testFinished ? 'Submitting answers...' : 'Processing...'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="content-section">
        {!testStarted ? (
          <div className="starting-overlay">
            <div className="starting-content">
              <div className="starting-spinner"></div>
              <h2>Starting Reading Test...</h2>
              <p>Please wait while we initialize your reading test.</p>
              {!accessToken && (
                <p className="error-text">No access token found. Please login first.</p>
              )}
              <p className="starting-tip">You will have 60 minutes to complete 3 passages with 40 questions.</p>
              <button 
                onClick={startReadingTest}
                className="retry-start-btn"
                disabled={!accessToken || loading}
              >
                {loading ? 'Starting...' : 'Click to Start Test'}
              </button>
            </div>
          </div>
        ) : currentView === 'passage' ? (
          <div className="passage-view">
            <div className="passage-card">
              <div className="passage-header">
                <h2>
                  {currentPassage === 1 && "Secret of Thailand's Success?"}
                  {currentPassage === 2 && "Patients Are a Virtue"}
                  {currentPassage === 3 && "Rise of the Robots"}
                </h2>
                <div className="passage-meta">
                  <span className="meta-item">
                    <span className="meta-label">Questions:</span>
                    <span className="meta-value">
                      {currentPassage === 1 && '1-13'}
                      {currentPassage === 2 && '14-26'}
                      {currentPassage === 3 && '27-40'}
                    </span>
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">Suggested Time:</span>
                    <span className="meta-value">20 minutes</span>
                  </span>
                </div>
              </div>
              
              <div className="passage-content">
                {currentPassage === 1 && (
                  <>
                    <p><strong>A.</strong> It is a question officials here in Asia are being posed more and more: Why are your economies so vibrant? Answers include young and swelling populations, decreased debt, growing cities, emerging middle-class consumer sectors, evolving markets and, of course, China's rise. Add this to that list: Women and their increasing role in Asia's economies. The idea is that the more opportunities women have, the more vibrant economies are and, consequently, the less need there is to amass a huge public debt to boost growth. It is an idea bolstered by a new survey by MasterCard International Inc., which compares the socio-economic level of women with men in Asia-Pacific nations. The gauge uses four key indicators: participation in the labour force, college education, managerial positions, and above-median income.</p>
                    
                    <p><strong>B.</strong> Which Asian nation is doing host when it comes to women's advancement? Thailand. It scored 92.3 of a possible 100, and according to MasterCard's index, 100 equals gender equality. The survey was based on interviews with 300 to 350 women in thirteen nations and national statistics. Malaysia came in second with a score of 86.2, while China came in third with 68.4. The average score in Asia was 67.7. At the bottom of the list is South Korea (45.5), followed by Indonesia (52.5), and Japan (54.5). Perhaps it is a bizarre coincidence, yet MasterCard's findings fit quite neatly with two important issues in Asia: economic leadership and debt. Thailand, Malaysia, and China are three economies widely seen as the future of Asia. Thailand's economic boom in recent years has prompted many leaders in the region to look at its growth strategy. Malaysia, which has a female central bank governor, is one of Asia's rising economic powers. China, of course, is the world's hottest economy, and one that is shaking up trade patterns and business decisions everywhere.</p>
                    
                    <p><strong>C.</strong> Something all three economies have in common is an above-average level of female participation. What the three worst ranked economies share are severe long-term economic challenges of high levels of debt and a female workforce that is being neglected. Research in economic history is very conclusive on the role of women in economic growth and development, says Yuwa Hedrick-Wong, an economic adviser to MasterCard. The more extensive women's participation at all areas of economic activities, the higher the probability for stronger economic growth. That, Hedrick-Wong says, means societies and economies that consistently fail to fully incorporate women's ability and talent in businesses, and the workplace will suffer the consequences. Take Korea, which has been walking in place economically in recent years. Immediately following the 1997--- 1998 Asian financial crisis, Korea became a regional role model as growth boomed and unemployment fell. Yet a massive increase in household debt left consumers overexposed and growth slowed.</p>
                    
                    <p><strong>D.</strong> Maybe it is a just coincidence that Korea also ranks low on measures of gender equality published by the United Nations. As of 2003, for example, it ranked below Honduras, Paraguay, Mauritius, and Ukraine in terms of women's economic and political empowerment. Utilising more of its female workforce would deepen Korea's labour pool and increase potential growth rates in the economy. The same goes for Japan. The reluctance of Asia's biggest economy to increase female participation and let more women into the executive suite exacerbates its biggest long-term challenge: a declining birth rate. In 2003, the number of children per Japanese woman fell to a record low of 1.29 versus about. 2 in the early 1970s. Preliminary government statistics suggest the rate declined further in 2004. The trend is nothing short of a crisis for a highly indebted nation of 126 million that has yet to figure out how to fund the national pension system down the road. Yet Japan has been slow to realise that for many women, the decision to delay childbirth is a form of rebellion against societal expectations to have children and become housewives,</p>
                    
                    <p><strong>E.</strong> It may be 2005, yet having children is a career-ending decision for millions of bright, ambitions, and well-educated Japanese, Until corrected, Japan's birth rate will drop and economic growth will lag, UN Secretary General Kofi Annan was absolutely right earlier this month when he said no other policy is as likely to raise economic productivity than the empowerment of women. Here, in Thailand, the government is getting some decent marks in this regard, and the economy's 6 per cent-plus growth rate may be a direct result. Thailand still has a long way to go. Yet the Bank of Thailand's deputy governor, Tarisa Watanagase, is a woman, as are seven of nine assistant governors. Then there's Jada Wattanasiritham, who runs Siam Commercial Bank Plc, Thailand's fourth-biggest lender. How many female chief executives can you name in Japan or Korea? Looked at broadly in Asia, MasterCard's survey is on to something. It is that giving women more opportunities to contribute to an economy is not just about fairness, but dollars and sense, too.</p>
                  </>
                )}
                
                {currentPassage === 2 && (
                  <>
                    <p><strong>A.</strong> Despite conference jeers, job cuts, and a financial crisis, health secretary Patricia Hewitt may find a reason to smile this week, as the NHS (British National Health Service) was named one of the top places to work by students. Among engineering, science, and IT students, the health service was ranked second in this year's Universum UK graduate survey of ideal employers, a leap of 54 places from last year. The annual survey, conducted in the UK since 1997, canvassed the opinions of more than 7,700 final and penultimate-year students studying for degrees in business, engineering, science, IT, and the humanities, at 39 universities, between January and March this year.</p>
                    
                    <p><strong>B.</strong> Each student was presented with a list of 130 employers, nominated by students through a separate process, from which they selected the five they considered to be ideal employers. The Universum list is based on the frequency of an organisation being selected as an ideal employer, following a weighting process. This year, government departments and public sector organisations dominated the top spots, with the BBC ranked first among humanities, engineering, science, and IT students, retaining its place from last year, and coming third for those studying business. Among humanities students, the BBC was followed closely by the Foreign and Commonwealth Office and the Civil Service fast stream. The Cabinet Office and the Ministry of Defence were not far behind, ranked fifth and sixth respectively. As well as the NHS, engineering, science, and IT students favoured the Environment Agency, which leapt 83 places, from 86 in 2005 to number three this year. Meanwhile, business students voted accountancy giants PricewaterhouseCoopers (PwC) as their favoured employer, followed by HSBC.</p>
                    
                    <p><strong>C.</strong> At a London awards ceremony sponsored by the Guardian, Foluke Ajayi, head of NHS careers at NHS employers, said its success this year reflected the reality of the health service, which is the third largest employer in the world and the largest in Europe. "We employ people in other clinical areas, such as health care. We employ IT managers, engineers, architects," she said, adding that the health service is no longer seen as a "second choice" career. "People recognise that they can give something back to the community, but still develop a worthwhile career."</p>
                    
                    <p><strong>D.</strong> Sarah Churchman, director of student recruitment and diversity at PwC, said her company's success is down to a good campus presence, its commitment to invest in its employees and, with offices around the world, the chance to travel, something which just under half of the students polled said was an important factor when it came to looking for work. One of the big four accountancy firms, PwC is not into gimmicks, and it does not offer freebies but, said Churchman, it does offer "a solid foundation" for anyone wanting a career in business. "We sell our people skills, so we are interested in building skills. We're not selling something, we invest in our people," she added.</p>
                    
                    <p><strong>E.</strong> Further down the rankings, but still with reason to celebrate, was John Lewis, which matched bumper sales this year with a leap from 111th place in 2005 to 26th among this year's humanities students. Sky found itself in 12th place, up from 104th last year, and the Environment Agency also proved popular among this student group, rising from 138th in 2005 to 7th this year. Among the business fraternity, shell saw a reversal of fortunes, rising to 30th place after last year's 76th position. There were a few dramatic drops in the rankings. The Bank of England fell from 14th in 2005 to 27th this year among humanities students, although it retained its mid-table position among those studying business. British Airways also saw a slight dip, as did McKinsey & Co, which dropped from 11th to 22nd among business undergraduates.</p>
                    
                    <p><strong>F.</strong> Perhaps more surprisingly, this year was the first appearance in the rankings of Teach First, a small charity launched three years ago that aims to create the "leaders of the future" by encouraging top graduates who would not normally consider a career in teaching to commit to work in "challenging" secondary schools for at least two years. The organisation came straight in at number eight among humanities students and was voted 22nd by those studying engineering, science, and IT. James Darley, director of graduate recruitment at Teach First, said he was "bowled over" by the news. "We were not expecting this. We're a registered charity, only able to physically go to 15 universities."</p>
                    
                    <p><strong>G.</strong> The scheme, based on one run in the US, has the backing of more than 80 businesses, including Deloitte and HSBC. During their two years, candidates undertake leadership training and emerge from the programme with a range of skills and experiences. "We hope in the long term they will be our ambassadors, as we call them, in politics, industry, charities, who will have done it and continue to support the educationally disadvantaged," adds Darley. This year, 260 graduates are expected to take up the Teach First challenge in schools in London and Manchester, More are expected over the coming years, as the scheme expands to Birmingham and three other cities by 2008. Of the first set of recruits to complete the programme, half have gone on to work for "some amazing companies", while the other half have chosen to stay on in their schools for a further year - 20% in leadership roles.</p>
                    
                    <p><strong>H.</strong> While more than half of students were concerned about achieving a good work life balance, a third said they wanted a job that would challenge them. Although male Students tended to focus more on the practical aspects of work, such as "building a sound financial base", women, particularly those studying for humanities degrees, had a more idealistic outlook, saying making a contribution to society was a key career goal. Almost half of all students said that paid overtime was a key part of any company compensation package, However, business students said that the most important compensation, apart from salary, was performance-related bonuses, while important considerations for humanities students were retirement plans. Working overseas also scored highly among those surveyed this year, with 45% of business students, and 44% of humanities students, listing it as a priority. Ethical considerations and corporate social responsibilities were also mentioned, with a large percentage of humanities and engineering, science and IT students saying it was a key consideration when it came to choosing an employer.</p>
                  </>
                )}
                
                {currentPassage === 3 && (
                  <>
                    <p>If you are into technology, you are living in wonderful times. Things are developing in leaps and bounds, especially gadgets. Let us look at the technology that is set to break through.</p>
                    
                    <div className="tech-section">
                      <h3>CELESTRON SKYSCOUT</h3>
                      <p>Backyard stargazing goes seriously hi-tech with the Celestron SkyScout, which was judged to be the Best of Innovations at the New York Consumer Electronics Show press preview event in November. It is not difficult to see why. The SkyScout is a hand-held viewing device that is capable of finding and identifying more than 6,000 celestial objects visible to the naked eye, thus transforming the night sky into your own personal planetarium. Using GPS technology and a substantial celestial database, the camcorder-sized SkyScout enables stargazers to point the device at any visible object in the sky, press a button, and then listen to a commentary. For the truly celestially challenged, if you want to view a star or planet but do not have a clue which bit of the heavens to look in, do not despair; the SkyScout's "locate" feature will guide you to it using illuminated arrows in the viewfinder.</p>
                    </div>
                    
                    <div className="tech-section">
                      <h3>NOKIA N91</h3>
                      <p>This amazing mobile jukebox is due out early in 2006. Nokia's N91 looks set to be in a class of its own as a multimedia mobile phone. It will play music, take photos, surf the web and download videos, store contact details, and generally organise your life. The robust little phone, resplendent in its stainless steel case, is the first Nokia to be equipped with a hard drive (4Gb), which means that it can store up to 3,000 songs. The N91, which has a hi-fi quality headset and remote control, supports a wide range of digital music formats, including MP3, Real, WAV, and WMA. It uses wireless technology to allow users to find and buy music from the operator's music store. You can also drag and drop music from your PC to the N91 and manage and share playlists. If you can find the time, you can get on the blower, too.</p>
                    </div>
                    
                    <div className="tech-section">
                      <h3>SEIKO SPECTRUM E-PAPER WATCH</h3>
                      <p>The Seiko Spectrum is no ordinary wristwatch. At first glance, it is an attractive and futuristic bracelet-style watch. Look closer, however, and you will notice that its display is unlike any you have seen before. Rather than the usual LCD screen, the display is made of "e-paper" - from the electronic paper pioneers E Ink Corp - and shows a constantly changing mosaic pattern along with the time. Because e-paper is so flexible and thin, it allows the display to curve round the wrist along with the watch band - something conventional liquid-crystal displays cannot do, as they have to be flat. Seiko says the e-paper display not only produces far better contrast than an LCD screen, but requires no power to retain an image, so the batteries last longer. Seiko is releasing only 500 of the watches next month, priced at about £1,250 - so you'd better lose no time.</p>
                    </div>
                    
                    <div className="tech-section">
                      <h3>HIGH-DEFINITION TV</h3>
                      <p>HDTV, already available in the United States, Japan, and Australia, will hit the UK in 2006. When you watch a programme filmed in the HD format, you will see a much sharper, clearer and more vibrant image. This is due partly to the way a programme is filmed, but also to the high-definition TV set itself, which uses either 720 or 1,080 visible rows of pixels (depending on which format the individual HDTV uses) to display images, compared to the 576 rows of pixels used in current sets.</p>
                    </div>
                    
                    <div className="tech-section">
                      <h3>ELECTROLUX TRILOBITE 2.0 ROBOT VACUUM CLEANER</h3>
                      <p>Next time you are expecting visitors, do not bother to vacuum first - wait until they arrive, and then entertain them with this little gadget. The Electrolux Trilobite 2.0 is a robotic vacuum cleaner that navigates its way around your floors using ultrasound, just like a bat. It pings out ultrasound vibrations at surfaces to create a map of the room, which it remembers for future cleaning assignments. The Trilobite has no problem avoiding collision with things placed on the floor. Special magnetic strips are placed in doorways, near stairs and other openings. These act as a wall, keeping the Trilobite in the room. You can also programme it to glide round when you're at work or after you've gone to bed. When Electrolux introduced the original Trilobite in 2001, it was voted among the 100 most innovative designs (though whether the judges were dedicated couch potatoes, and thus biased, we were not aide to discover). The name comes from the hard-shelled sea creature from the Paleozoic era (between 250 million and 560 million years ago) that roamed the ocean floor feeding on particles and small animals.</p>
                    </div>
                    
                    <div className="tech-section">
                      <h3>HONDA ASIMO ROBOT</h3>
                      <p>Need an extra pair of hands around the office? Look no further; this month, the Honda Motor Company showcased its second-generation humanoid robot, Asimo. The machine has come a long way since its first incarnation five years ago. The 1.3 metre-tall droid is now capable of performing a variety of office tasks, including reception duties, serving drinks and acting as an information guide, as well as making deliveries. Using multiple sensors, Asimo has the ability to recognise the surrounding environment and interact with people using integrated circuit tags. It can walk and run at a fair pace, and push a cart. Honda plans to start using Asimo's receptionist functions at its Wako Building in Japan early in 2006, and it is hoped it will become available for leasing afterwards. It could soon be pushing a cart at an office near you.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="questions-view">
            <div className="questions-container">
              {currentPassage === 1 && (
                <div className="questions-card">
                  <div className="questions-header">
                    <h2>Passage 1 Questions</h2>
                    <span className="questions-count">Questions 1-13</span>
                  </div>

                  {/* Questions 1-4 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 1-4</h3>
                      <p className="group-instruction">Which paragraph contains each of the following pieces of information?</p>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 1, text: "The fact that a woman runs one of Thailand's biggest banks"},
                        {num: 2, text: "The number of countries included in the survey"},
                        {num: 3, text: "The fact that Japan's birth rate is falling quickly"},
                        {num: 4, text: "The criteria used to get a score for each country"}
                      ].map(({num, text}) => (
                        <div key={num} className="question-block">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">{text}</p>
                          </div>
                          {renderParagraphButtons(`q${num}`, 'passage1', handlePassage1Change, 'E')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions 5-8 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 5-8</h3>
                      <p className="group-instruction">Complete the following sentences using <strong>NO MORE THAN THREE WORDS</strong> from the text for each gap.</p>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 5, text: "Higher consumption in the", suffix: "sector of the market is one reason that Asia's economies are doing well."},
                        {num: 6, text: "The scores were decided through a combination of interviews and"},
                        {num: 7, text: "Higher", suffix: "has created an economic problem for Korea."},
                        {num: 8, text: "Japanese politicians have not yet decided how to get money for the"}
                      ].map(({num, text, suffix}) => (
                        <div key={num} className="question-block fill-in">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">
                              {text} 
                              <input
                                type="text"
                                value={answers.passage1[`q${num}`]}
                                onChange={(e) => handlePassage1Change(`q${num}`, e.target.value)}
                                className="fill-input"
                                disabled={testFinished || loading || !testStarted}
                                placeholder="Type your answer"
                                maxLength="30"
                              />
                              {suffix && ` ${suffix}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions 9-13 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 9-13</h3>
                      <p className="group-instruction">Do the following statements agree with the information given in Reading Passage 1?</p>
                      <div className="tfng-legend">
                        <div className="legend-item true">TRUE - if the statement agrees with the information</div>
                        <div className="legend-item false">FALSE - if the statement contradicts the information</div>
                        <div className="legend-item not-given">NOT GIVEN - if there is no information on this</div>
                      </div>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 9, text: "Other countries are looking at the example of Thailand to see if its policies can help their economies."},
                        {num: 10, text: "Higher female participation in an economy always leads to greater economic growth."},
                        {num: 11, text: "Female participation in the economy is lower in Japan than in most other developed economies."},
                        {num: 12, text: "Most of the Bank of Thailand's assistant governors are female."},
                        {num: 13, text: "The writer considers 'fairness' to be a bad reason for giving women top jobs."}
                      ].map(({num, text}) => (
                        <div key={num} className="question-block tfng-block">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">{text}</p>
                          </div>
                          {renderTFNGButtons(`q${num}`, 'passage1', handlePassage1Change)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentPassage === 2 && (
                <div className="questions-card">
                  <div className="questions-header">
                    <h2>Passage 2 Questions</h2>
                    <span className="questions-count">Questions 14-26</span>
                  </div>

                  {/* Questions 14-17 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 14-17</h3>
                      <p className="group-instruction">Which paragraph does each of the following headings best fit?</p>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 14, text: "Most popular employers for different students"},
                        {num: 15, text: "Students' expectations"},
                        {num: 16, text: "Give and develop with the NHS"},
                        {num: 17, text: "Reason for the NHS to be happy"}
                      ].map(({num, text}) => (
                        <div key={num} className="question-block">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">{text}</p>
                          </div>
                          {renderParagraphButtons(`q${num}`, 'passage2', handlePassage2Change, 'H')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions 18-22 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 18-22</h3>
                      <p className="group-instruction">According to the text, <strong>FIVE</strong> of the following statements are true. Write the corresponding letters in answer boxes 18 to 22 in any order.</p>
                    </div>
                    
                    <div className="statements-card">
                      <div className="statements-grid">
                        {statements.map(({letter, text}) => (
                          <label key={letter} className="statement-item">
                            <input
                              type="checkbox"
                              checked={[
                                answers.passage2.q18,
                                answers.passage2.q19,
                                answers.passage2.q20,
                                answers.passage2.q21,
                                answers.passage2.q22
                              ].includes(letter)}
                              onChange={(e) => {
                                if (testFinished || loading || !testStarted) return;
                                const selectedLetters = [
                                  answers.passage2.q18,
                                  answers.passage2.q19,
                                  answers.passage2.q20,
                                  answers.passage2.q21,
                                  answers.passage2.q22
                                ].filter(l => l !== '');
                                
                                if (e.target.checked && selectedLetters.length < 5) {
                                  const emptySlot = ['q18', 'q19', 'q20', 'q21', 'q22']
                                    .find(key => !answers.passage2[key] || answers.passage2[key] === '');
                                  if (emptySlot) handlePassage2Change(emptySlot, letter);
                                } else if (!e.target.checked) {
                                  ['q18', 'q19', 'q20', 'q21', 'q22'].forEach(key => {
                                    if (answers.passage2[key] === letter) {
                                      handlePassage2Change(key, '');
                                    }
                                  });
                                }
                              }}
                              disabled={testFinished || loading || !testStarted}
                            />
                            <span className="statement-letter">{letter}.</span>
                            <span className="statement-text">{text}</span>
                          </label>
                        ))}
                      </div>
                      
                      <div className="answer-boxes">
                        <p className="boxes-title">Write your answers here:</p>
                        <div className="boxes-row">
                          {[18, 19, 20, 21, 22].map(num => (
                            <div key={num} className="answer-box">
                              <label className="box-label">Box {num}</label>
                              <input
                                type="text"
                                value={answers.passage2[`q${num}`]}
                                onChange={(e) => handlePassage2Change(`q${num}`, e.target.value.toUpperCase())}
                                className="box-input"
                                maxLength={1}
                                disabled={testFinished || loading || !testStarted}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions 23-24 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 23-24</h3>
                      <p className="group-instruction">According to the information given in the text, choose the correct answer or answers from the choices given.</p>
                    </div>
                    
                    <div className="mcq-card">
                      <div className="mcq-question">
                        <p className="mcq-text"><strong>23. The survey covered students</strong></p>
                        <div className="mcq-options">
                          {[
                            {letter: 'A', text: "from all British universities"},
                            {letter: 'B', text: "studying a variety of subjects"},
                            {letter: 'C', text: "who were in their last year of studies only"}
                          ].map(({letter, text}) => (
                            <label key={letter} className="mcq-option">
                              <input
                                type="checkbox"
                                checked={answers.passage2.q23.includes(letter)}
                                onChange={() => !testFinished && !loading && testStarted && handlePassage2MultiChoice('q23', letter)}
                                disabled={testFinished || loading || !testStarted}
                              />
                              <span className="option-letter">{letter}.</span>
                              <span className="option-text">{text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mcq-question">
                        <p className="mcq-text"><strong>24. The BBC</strong></p>
                        <div className="mcq-options">
                          {[
                            {letter: 'A', text: "was first choice in most categories"},
                            {letter: 'B', text: "was unpopular with business students"},
                            {letter: 'C', text: "employs more graduates than most other organisations and companies"}
                          ].map(({letter, text}) => (
                            <label key={letter} className="mcq-option">
                              <input
                                type="checkbox"
                                checked={answers.passage2.q24.includes(letter)}
                                onChange={() => !testFinished && !loading && testStarted && handlePassage2MultiChoice('q24', letter)}
                                disabled={testFinished || loading || !testStarted}
                              />
                              <span className="option-letter">{letter}.</span>
                              <span className="option-text">{text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions 25-26 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 25-26</h3>
                      <p className="group-instruction">According to the information given in the text, choose the correct answer or answers from the choices given.</p>
                    </div>
                    
                    <div className="mcq-card">
                      <p className="mcq-text"><strong>Sarah Churchman says PwC did well in the survey because it</strong></p>
                      <div className="mcq-options">
                        {[
                          {letter: 'A', text: "often goes to universities to meet students"},
                          {letter: 'B', text: "provides many scholarships for students"},
                          {letter: 'C', text: "offers many opportunities to travel"}
                        ].map(({letter, text}) => (
                          <label key={letter} className="mcq-option">
                            <input
                              type="checkbox"
                              checked={answers.passage2.q25.includes(letter)}
                              onChange={() => !testFinished && !loading && testStarted && handlePassage2MultiChoice('q25', letter)}
                              disabled={testFinished || loading || !testStarted}
                            />
                            <span className="option-letter">{letter}.</span>
                            <span className="option-text">{text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPassage === 3 && (
                <div className="questions-card">
                  <div className="questions-header">
                    <h2>Passage 3 Questions</h2>
                    <span className="questions-count">Questions 27-40</span>
                  </div>

                  {/* Questions 27-30 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 27-30</h3>
                      <p className="group-instruction">For each question, only <strong>ONE</strong> of the choices is correct. Write the corresponding letter in the appropriate box on your answer sheet.</p>
                    </div>
                    
                    <div className="single-mcq-card">
                      {[
                        {num: 27, text: "The Celestron SkyScout can", options: [
                          {letter: 'A', text: "tell you information about the stars"},
                          {letter: 'B', text: "tell you where in the world you are"},
                          {letter: 'C', text: "find objects in the sky that are not normally visible"}
                        ]},
                        {num: 28, text: "The Seiko Spectrum e-paper watch", options: [
                          {letter: 'A', text: "cannot be bent"},
                          {letter: 'B', text: "can be used for surfing the Internet"},
                          {letter: 'C', text: "is being produced as a limited edition"}
                        ]},
                        {num: 29, text: "The Electrolux Trilobite 2.0 robot vacuum cleaner", options: [
                          {letter: 'A', text: "asks permission before moving from room to room"},
                          {letter: 'B', text: "uses lasers to help it avoid objects"},
                          {letter: 'C', text: "is programmable"}
                        ]},
                        {num: 30, text: "The Honda Asimo robot", options: [
                          {letter: 'A', text: "has two pairs of hands"},
                          {letter: 'B', text: "uses lasers to help it recognise its surroundings"},
                          {letter: 'C', text: "can run"}
                        ]}
                      ].map(({num, text, options}) => (
                        <div key={num} className="single-mcq">
                          <p className="single-mcq-text"><strong>{num}. {text}</strong></p>
                          <div className="single-options">
                            {options.map(({letter, text: optionText}) => (
                              <button
                                key={letter}
                                className={`single-option ${answers.passage3[`q${num}`] === letter ? 'selected' : ''}`}
                                onClick={() => handlePassage3Change(`q${num}`, letter)}
                                disabled={testFinished || loading || !testStarted}
                              >
                                <span className="single-letter">{letter}</span>
                                <span className="single-text">{optionText}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions 31-35 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 31-35</h3>
                      <p className="group-instruction">Complete the following sentences using <strong>NO MORE THAN THREE WORDS</strong> from the text for each gap.</p>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 31, text: "The SkyScout uses GPS and", suffix: "to help you find a star."},
                        {num: 32, text: "The Seiko Spectrum does not need batteries to power the"},
                        {num: 33, text: "HDTV uses more", suffix: "than conventional TV."},
                        {num: 34, text: "The Trilobite 2.0 could be used to", suffix: "guests."},
                        {num: 35, text: "Asimo first appeared"}
                      ].map(({num, text, suffix}) => (
                        <div key={num} className="question-block fill-in">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">
                              {text} 
                              <input
                                type="text"
                                value={answers.passage3[`q${num}`]}
                                onChange={(e) => handlePassage3Change(`q${num}`, e.target.value)}
                                className="fill-input"
                                disabled={testFinished || loading || !testStarted}
                                placeholder="Type your answer"
                                maxLength="30"
                              />
                              {suffix && ` ${suffix}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions 36-40 */}
                  <div className="question-group-card">
                    <div className="group-title">
                      <h3>Questions 36-40</h3>
                      <p className="group-instruction">Do the following statements agree with the information given in Reading Passage 3?</p>
                      <div className="tfng-legend">
                        <div className="legend-item true">TRUE - if the statement agrees with the information</div>
                        <div className="legend-item false">FALSE - if the statement contradicts the information</div>
                        <div className="legend-item not-given">NOT GIVEN - if there is no information on this</div>
                      </div>
                    </div>
                    
                    <div className="questions-list">
                      {[
                        {num: 36, text: "The Nokia N91 is strong."},
                        {num: 37, text: "E-paper can be torn easily."},
                        {num: 38, text: "HDTV is filmed differently to conventional TV."},
                        {num: 39, text: "The Trilobite 2.0 looks just like the original design."},
                        {num: 40, text: "Asimo is available for export."}
                      ].map(({num, text}) => (
                        <div key={num} className="question-block tfng-block">
                          <div className="question-text-block">
                            <span className="q-number">Q{num}</span>
                            <p className="q-text">{text}</p>
                          </div>
                          {renderTFNGButtons(`q${num}`, 'passage3', handlePassage3Change)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-left">
            <span className="hint">💡 Tip: Read the passage carefully and manage your time wisely</span>
          </div>
          <div className="footer-right">
            <button 
              className="next-passage-btn"
              onClick={() => {
                if (currentPassage < 3) {
                  setCurrentPassage(currentPassage + 1);
                }
              }}
              disabled={currentPassage === 3 || !testStarted || loading}
            >
              Next Passage →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Reading;