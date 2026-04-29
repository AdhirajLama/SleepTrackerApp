import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, Paper, Typography, Box, MenuItem, TextField } from '@mui/material';
import { API_BASE_URL } from '../../constants/api';
import { getAuthHeaders } from '../../utils/authHeaders';
import './SleepAdvice.css';

function SleepAdvice() {
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('other');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [scheduleConsistency, setScheduleConsistency] = useState('somewhat_consistent');
  const [screenUseBeforeBed, setScreenUseBeforeBed] = useState('sometimes');
  const [caffeineLevel, setCaffeineLevel] = useState('light');
  const [advicePayload, setAdvicePayload] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/profile`, { headers: getAuthHeaders() });
      if (res.data.age != null) setAge(String(res.data.age));
      if (res.data.profession) setProfession(res.data.profession);
      if (res.data.activityLevel) setActivityLevel(res.data.activityLevel);
      if (res.data.scheduleConsistency) setScheduleConsistency(res.data.scheduleConsistency);
      if (res.data.screenUseBeforeBed) setScreenUseBeforeBed(res.data.screenUseBeforeBed);
      if (res.data.caffeineLevel) setCaffeineLevel(res.data.caffeineLevel);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAdvice = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/advice`, { headers: getAuthHeaders() });
      setAdvicePayload(res.data);
    } catch (e) {
      console.error(e);
      setError('Could not load sleep advice. Ensure you are logged in and the server is running.');
      setAdvicePayload(null);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadAdvice();
  }, [loadAdvice]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.put(
        `${API_BASE_URL}/api/profile`,
        {
          age: age === '' ? undefined : Number(age),
          profession,
          activityLevel,
          scheduleConsistency,
          screenUseBeforeBed,
          caffeineLevel,
        },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      await loadAdvice();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sleep-advice-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Sleep Advice
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Personalized tips use your profile (age, profession, activity, schedule, screens, caffeine) together with
        your recent sleep logs. This is general wellness education—not medical diagnosis or treatment.
      </Typography>

      {error && <div className="sleep-advice-error">{error}</div>}

      <Paper className="sleep-advice-section" elevation={2}>
        <Typography variant="h6" gutterBottom>
          Your profile
        </Typography>
        <Box component="form" onSubmit={handleSaveProfile} className="sleep-advice-form">
          <TextField
            label="Age"
            type="number"
            inputProps={{ min: 13, max: 120 }}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            size="small"
            helperText="Used to suggest typical sleep-duration targets."
          />
          <TextField
            select
            label="Profession / role"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            size="small"
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="professional">Professional / office</MenuItem>
            <MenuItem value="shift_worker">Shift worker</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            select
            label="Physical activity"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            size="small"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="moderate">Moderate</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            select
            label="Wake / bedtime consistency"
            value={scheduleConsistency}
            onChange={(e) => setScheduleConsistency(e.target.value)}
            size="small"
            helperText="How regular your sleep windows are."
          >
            <MenuItem value="irregular">Irregular</MenuItem>
            <MenuItem value="somewhat_consistent">Somewhat consistent</MenuItem>
            <MenuItem value="consistent">Consistent</MenuItem>
          </TextField>
          <TextField
            select
            label="Screen use before bed"
            value={screenUseBeforeBed}
            onChange={(e) => setScreenUseBeforeBed(e.target.value)}
            size="small"
          >
            <MenuItem value="often">Often</MenuItem>
            <MenuItem value="sometimes">Sometimes</MenuItem>
            <MenuItem value="rarely">Rarely</MenuItem>
          </TextField>
          <TextField
            select
            label="Caffeine (typical day)"
            value={caffeineLevel}
            onChange={(e) => setCaffeineLevel(e.target.value)}
            size="small"
          >
            <MenuItem value="none">None / minimal</MenuItem>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="moderate">Moderate</MenuItem>
            <MenuItem value="heavy">Heavy</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile & refresh advice'}
          </Button>
        </Box>
      </Paper>

      {advicePayload && (
        <>
          <Paper className="sleep-advice-section" elevation={2}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography variant="body1">{advicePayload.summary}</Typography>
            {advicePayload.score != null && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Wellness score: <strong>{advicePayload.score}</strong> / 100
              </Typography>
            )}
            {advicePayload.confidence && (
              <Typography variant="body2" color="text.secondary">
                Confidence: <strong>{advicePayload.confidence}</strong>
                {advicePayload.confidenceDetail ? ` — ${advicePayload.confidenceDetail}` : ''}
              </Typography>
            )}
            {advicePayload.disclaimer && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                {advicePayload.disclaimer}
              </Typography>
            )}
            {advicePayload.metrics && (
              <Box className="sleep-advice-metrics">
                <Typography variant="body2">
                  Logs used: {advicePayload.metrics.logCount ?? '—'}
                </Typography>
                <Typography variant="body2">
                  Avg hours (recent):{' '}
                  {advicePayload.metrics.avgHoursLast14 != null
                    ? advicePayload.metrics.avgHoursLast14.toFixed(1)
                    : '—'}
                </Typography>
                <Typography variant="body2">
                  Target range: {advicePayload.metrics.recommendedRange ?? '—'}
                </Typography>
                <Typography variant="body2">
                  Dominant quality: {advicePayload.metrics.dominantQuality ?? '—'}
                </Typography>
                {advicePayload.metrics.avgQualityScore != null && (
                  <Typography variant="body2">
                    Avg quality score (1–4): {advicePayload.metrics.avgQualityScore}
                  </Typography>
                )}
                {advicePayload.metrics.scheduleVarianceHours != null && (
                  <Typography variant="body2">
                    Night-to-night hour variation (std. dev.):{' '}
                    {advicePayload.metrics.scheduleVarianceHours}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>

          {Array.isArray(advicePayload.references) && advicePayload.references.length > 0 && (
            <Paper className="sleep-advice-section" elevation={2} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Further reading (general education)
              </Typography>
              <ul className="sleep-advice-list">
                {advicePayload.references.map((ref, idx) => (
                  <li key={idx}>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer">
                      {ref.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Paper>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Recommendations
          </Typography>
          <ul className="sleep-advice-list">
            {(advicePayload.advice || []).map((item, idx) => (
              <li key={idx}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default SleepAdvice;
