import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
} from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import { getUser } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const CURSOR_COLORS = ['#e91e63', '#2196f3', '#4caf50', '#ff9800'];

const getColorForId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

/**
 * @param {string} sessionId - the co-browse session token, from ?cobrowse=xxx in the URL
 */
const CoBrowseOverlay = ({ sessionId }) => {
  const socketRef = useRef(null);
  const [cursors, setCursors] = useState({}); // { socketId: { xPercent, yPercent, name } }
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const user = getUser();
    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('cobrowse:join', {
      sessionId,
      name: user ? user.name : 'Guest',
    });

    socket.on('cobrowse:joined', ({ participantCount }) => {
      setParticipantCount(participantCount);
    });

    socket.on('cobrowse:participant-joined', () => {
      setParticipantCount((prev) => prev + 1);
    });

    socket.on('cobrowse:participant-left', ({ id }) => {
      setParticipantCount((prev) => Math.max(1, prev - 1));
      setCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on('cobrowse:cursor', ({ id, name, xPercent, yPercent }) => {
      setCursors((prev) => ({ ...prev, [id]: { name, xPercent, yPercent } }));
    });

    socket.on('cobrowse:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const handleMouseMove = (e) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = ((e.clientY + window.scrollY) / document.body.scrollHeight) * 100;
      socket.emit('cobrowse:cursor', { sessionId, xPercent, yPercent });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.emit('cobrowse:leave');
      socket.disconnect();
    };
  }, [sessionId]);

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('cobrowse:message', { sessionId, text: chatInput.trim() });
    setChatInput('');
  };

  if (!sessionId) return null;

  return (
    <>
      {/* other participants' cursors */}
      {Object.entries(cursors).map(([id, cursor]) => (
        <Box
          key={id}
          position="absolute"
          left={`${cursor.xPercent}%`}
          top={`${cursor.yPercent}%`}
          style={{ pointerEvents: 'none', zIndex: 2000, transition: 'left 0.1s, top 0.1s' }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getColorForId(id),
              border: '2px solid white',
            }}
          />
          <Typography
            variant="caption"
            style={{
              backgroundColor: getColorForId(id),
              color: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {cursor.name}
          </Typography>
        </Box>
      ))}

      {/* status + chat panel */}
      <Box position="fixed" bottom={24} left={24} zIndex={1300}>
        {chatOpen ? (
          <Paper style={{ width: 280, height: 320, display: 'flex', flexDirection: 'column' }}>
            <Box p={1} bgcolor="primary.main" color="primary.contrastText">
              <Typography variant="subtitle2">
                Shopping together ({participantCount} here)
              </Typography>
            </Box>
            <Box flex={1} overflow="auto" p={1}>
              {messages.map((msg, i) => (
                <Box key={i} mb={1}>
                  <Typography variant="caption" style={{ color: getColorForId(msg.id), fontWeight: 'bold' }}>
                    {msg.name}
                  </Typography>
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>
              ))}
            </Box>
            <Box display="flex" p={1} borderTop="1px solid #eee">
              <TextField
                size="small"
                fullWidth
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Say something..."
              />
              <IconButton size="small" onClick={sendMessage}>
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        ) : (
          <Chip
            label={`👀 Shopping together (${participantCount})`}
            onClick={() => setChatOpen(true)}
            color="primary"
            clickable
          />
        )}
      </Box>
    </>
  );
};

export default CoBrowseOverlay;
