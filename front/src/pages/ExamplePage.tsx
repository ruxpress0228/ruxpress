import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../utils/api';

export default function ExamplePage() {
  const { t } = useTranslation();
  const [helloResult, setHelloResult] = useState<string>('');
  const [timeResult, setTimeResult] = useState<string>('');
  const [echoInput, setEchoInput] = useState<string>('');
  const [echoResult, setEchoResult] = useState<string>('');
  const [loading, setLoading] = useState<string>('');

  const callHello = async () => {
    setLoading('hello');
    try {
      const res = await api.get<Record<string, string>>('/v1/examples/hello');
      setHelloResult(JSON.stringify(res, null, 2));
    } catch {
      setHelloResult(t('example.error'));
    }
    setLoading('');
  };

  const callTime = async () => {
    setLoading('time');
    try {
      const res = await api.get<Record<string, string>>('/v1/examples/time');
      setTimeResult(JSON.stringify(res, null, 2));
    } catch {
      setTimeResult(t('example.error'));
    }
    setLoading('');
  };

  const callEcho = async () => {
    if (!echoInput.trim()) return;
    setLoading('echo');
    try {
      const res = await api.post<Record<string, unknown>>('/v1/examples/echo', { message: echoInput });
      setEchoResult(JSON.stringify(res, null, 2));
    } catch {
      setEchoResult(t('example.error'));
    }
    setLoading('');
  };

  const resultStyle = {
    background: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'monospace',
    fontSize: '13px',
    marginTop: '8px',
  };

  return (
    <div>
      <h2>{t('example.title')}</h2>

      <section style={{ marginBottom: '24px' }}>
        <button onClick={callHello} disabled={loading === 'hello'}>
          {loading === 'hello' ? t('example.loading') : t('example.hello')}
        </button>
        {helloResult && <pre style={resultStyle}>{helloResult}</pre>}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <button onClick={callTime} disabled={loading === 'time'}>
          {loading === 'time' ? t('example.loading') : t('example.time')}
        </button>
        {timeResult && <pre style={resultStyle}>{timeResult}</pre>}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3>{t('example.echo')}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={echoInput}
            onChange={(e) => setEchoInput(e.target.value)}
            placeholder={t('example.echo.placeholder')}
            style={{ flex: 1, padding: '8px' }}
            onKeyDown={(e) => e.key === 'Enter' && callEcho()}
          />
          <button onClick={callEcho} disabled={loading === 'echo'}>
            {loading === 'echo' ? t('example.loading') : t('example.echo.send')}
          </button>
        </div>
        {echoResult && <pre style={resultStyle}>{echoResult}</pre>}
      </section>
    </div>
  );
}
