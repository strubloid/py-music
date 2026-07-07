import React, { useState } from 'react';
import { Zap, Trophy, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './DailyChallenge.css';

const DailyChallenge = () => {
  const { user, isLoggedIn } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [streak] = useState(3);

  // Placeholder challenge
  const challenge = {
    title: 'Name the Scale',
    description: 'Which scale contains these notes: C – E – G – B – D?',
    options: ['C Major 7th', 'G Major 7th', 'D Minor 7th', 'A Minor 7th'],
    answer: 1,
  };

  return (
    <div className="daily-page">
      <div className="daily-header">
        <Zap className="daily-icon" size={28} />
        <div>
          <h1>Daily Challenge</h1>
          <p className="daily-subtitle">
            {isLoggedIn ? `Welcome back, ${user?.username}` : 'Guest mode — sign up to save your streak!'}
          </p>
        </div>
        {isLoggedIn && (
          <div className="streak-badge">
            <Flame size={16} />
            <span>{streak} day streak</span>
          </div>
        )}
      </div>

      <div className="challenge-card">
        <div className="challenge-meta">
          <Trophy size={16} />
          <span>+50 XP for completing</span>
        </div>

        <h2 className="challenge-title">{challenge.title}</h2>
        <p className="challenge-question">{challenge.description}</p>

        <div className="challenge-options">
          {challenge.options.map((opt, i) => (
            <button
              key={i}
              className={`challenge-option ${completed && i === challenge.answer ? 'correct' : ''}`}
              onClick={() => !completed && setCompleted(true)}
              disabled={completed}
            >
              {opt}
            </button>
          ))}
        </div>

        {completed && (
          <div className="challenge-result">
            <span className="result-emoji">🎉</span>
            <p>Correct! You earned <strong>+50 XP</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;
