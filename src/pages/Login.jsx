import React, { useState } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const baseUrl = 'https://qwertyuiop999.pythonanywhere.com/';

  const validateForm = () => {
    if (!firstName.trim()) {
      setError('First Name is required (will be used as username)');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last Name is required (will be used as password)');
      return false;
    }
    if (lastName.length < 6) {
      setError('Last Name must be at least 6 characters (used as password)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      let tokens = null;
      
      // Step 1: Register the user using first name as username, last name as password
      const registerResponse = await fetch(`${baseUrl}auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: firstName, // Using first name as username
          password: lastName   // Using last name as password
        })
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        
        // If user already exists (409 Conflict or 400 Bad Request), try to login instead
        if (registerResponse.status === 409 || registerResponse.status === 400) {
          setSuccess('User already exists. Attempting to login...');
          
          // Step 1b: Login with the same credentials
          const loginResponse = await fetch(`${baseUrl}auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: firstName,
              password: lastName
            })
          });

          if (!loginResponse.ok) {
            throw new Error('Login failed. Please check your credentials or try different names.');
          }

          tokens = await loginResponse.json();
        } else {
          throw new Error(errorData.detail || 'Registration failed. Please try again.');
        }
      } else {
        // Registration successful
        const registerData = await registerResponse.json();
        
        // Backend returns tokens object with access and refresh
        if (registerData.tokens && registerData.tokens.access && registerData.tokens.refresh) {
          tokens = registerData.tokens;
          setSuccess('Registration successful! Logging you in...');
        } else if (registerData.access && registerData.refresh) {
          // If tokens are directly in the response
          tokens = registerData;
          setSuccess('Registration successful! Logging you in...');
        } else {
          // If no tokens returned, try to login
          const loginResponse = await fetch(`${baseUrl}auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: firstName,
              password: lastName
            })
          });

          if (!loginResponse.ok) {
            throw new Error('Registration succeeded but auto-login failed. Please try again.');
          }

          tokens = await loginResponse.json();
          setSuccess('Registration successful! Logging you in...');
        }
      }

      // Step 2: Join exam with ID 1 using the access token
      const joinResponse = await fetch(`${baseUrl}exam/exams/3/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        }
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json().catch(() => ({}));
        console.error('Join exam error:', errorData);
        
        // Check if user has already joined this exam
        if (joinResponse.status === 400) {
          setSuccess('You have already joined this exam. Proceeding to test...');
        } else {
          throw new Error('Failed to join exam. Please try again.');
        }
      } else {
        setSuccess('Successfully joined the exam!');
      }

      // Store tokens for future API calls
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('username', firstName);
      localStorage.setItem('displayName', `${firstName} ${lastName}`);
      
      // Show success message and navigate after a short delay
      setTimeout(() => {
        navigate('/listening', {params: {examId:3}});
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setError('');
    setSuccess('');
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Generate a random username and password for demo
    const demoFirstName = `DemoUser${Math.floor(Math.random() * 10000)}`;
    const demoLastName = `Password${Math.floor(Math.random() * 10000)}`;
    
    setFirstName(demoFirstName);
    setLastName(demoLastName);
    
    try {
      // Try to register with demo credentials
      const registerResponse = await fetch(`${baseUrl}auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: demoFirstName,
          password: demoLastName
        })
      });

      let tokens = null;
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        tokens = registerData.tokens || registerData;
        setSuccess('Demo account created successfully!');
      } else {
        // If registration fails (maybe username exists), try with different random
        return handleDemoLogin(); // Recursively try with new random
      }

      // Join exam
      await fetch(`${baseUrl}exam/exams/1/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        }
      });

      // Store tokens
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('username', demoFirstName);
      localStorage.setItem('displayName', `Demo User`);
      localStorage.setItem('isDemo', 'true');
      
      setSuccess('Demo login successful! Redirecting to test...');
      
      setTimeout(() => {
        navigate('/listening');
      }, 1500);
      
    } catch (err) {
      setError('Demo login failed. Please try manual registration.');
      setLoading(false);
    }
  };

  return (
    <div className="dark-container login-container">
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <h2>IELTS Listening Test Registration</h2>
            <p className="login-subtitle">
              Enter your details to begin the test. Your first name will be used as username and last name as password.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your first name"
                  required
                  disabled={loading}
                  minLength="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                  
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your last name"
                  required
                  disabled={loading}
                  minLength="6"
                />
              </div>
            </div>

            

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Start Listening Test'}
              </button>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="login-clear-btn"
                  onClick={clearForm}
                  disabled={loading}
                >
                  Clear Form
                </button>
                
                
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;