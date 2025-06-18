import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [reactionTime, setReactionTime] = useState(0);
  const [fakeButton, setFakeButton] = useState(false);
  const [message, setMessage] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [records, setRecords] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]); // 保存された記録を管理

  useEffect(() => {
    // ゲーム開始時に保存された記録を取得
    const fetchRecords = async () => {
      const response = await fetch('/reaction-times');
      const data = await response.json();
      setSavedRecords(data);
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted) {
      timer = setTimeout(() => {
        setButtonVisible(true);
        setFakeButton(Math.random() < 0.5);
        setStartTime(Date.now());
      }, Math.random() * 3000 + 2000);
    }
    return () => clearTimeout(timer);
  }, [gameStarted]);

  useEffect(() => {
    if (buttonVisible && fakeButton) {
      const id = setTimeout(() => {
        if (!gameOver) {
          setGameOver(true);
          setMessage('あなたは賢い！フェイクボタンを押しませんでした');
        }
      }, 3000);
      setTimeoutId(id);
    }
    return () => clearTimeout(timeoutId);
  }, [buttonVisible, fakeButton, gameOver]);

  const handleClick = async () => {
    const endTime = Date.now();
    const reactionDuration = endTime - startTime;

    clearTimeout(timeoutId);

    if (fakeButton) {
      setMessage('アホ！');
      setReactionTime(0);
    } else {
      setReactionTime(reactionDuration);
      setMessage(`反応速度: ${reactionDuration} ms`);

      // バックエンドに反応速度を送信
      await fetch('/reaction-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction_time: reactionDuration }),
      });

      // 反応速度を記録に追加
      setRecords((prevRecords) => [...prevRecords, reactionDuration]);
      setSavedRecords((prevRecords) => [...prevRecords, reactionDuration]); // 保存された記録にも追加
    }
    setGameOver(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setButtonVisible(false);
    setMessage('');
    setGameOver(false);
    setTimeoutId(null);
  };

  const showRecords = () => {
    if (savedRecords.length === 0) {
      alert("これまでの記録はありません。");
      return;
    }
    const sortedRecords = [...savedRecords].sort((a, b) => a - b);
    alert(`これまでの記録:
${sortedRecords.join('\n')} ms`);
  };

  return (
    <div className="App">
      <h1>反応速度測定ゲーム</h1>
      {!gameStarted ? (
        <div>
          <button onClick={() => setGameStarted(true)}>ゲームスタート</button>
          <button onClick={showRecords}>これまでの記録</button>
        </div>
      ) : gameOver ? (
        <div style={{ textAlign: 'center' }}>
          <h2>リザルト</h2>
          {message}
          <h3 style={{ margin: '20px 0' }}> {reactionTime > 0 ? '' : '記録なし'}</h3>
          <div style={{ marginTop: '20px' }}>
            <button onClick={resetGame} style={{ marginRight: '10px' }}>再スタート</button>
            <button onClick={showRecords}>これまでの記録</button>
          </div>
        </div>
      ) : (
        <div>
          {buttonVisible && (
            <button
              id="reaction-button"
              style={{
                backgroundColor: fakeButton ? 'red' : 'green',
                width: '200px',
                height: '100px',
                fontSize: '24px',
              }}
              onClick={handleClick}
            >
              {fakeButton ? 'フェイクボタン' : '押して！'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
