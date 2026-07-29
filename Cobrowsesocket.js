/**
 * Live co-browsing.
 *
 * A "session" is just a room identified by a random token embedded in
 * a shareable URL (?cobrowse=<token>). Anyone who opens that URL joins
 * the same room and starts seeing each other's cursor position and
 * chat messages on that product page. No accounts or persistence
 * needed — a session only exists as long as people are connected to it.
 */

const MAX_PARTICIPANTS_PER_SESSION = 4;

module.exports = (io) => {
  // sessionId -> Set of socket ids currently in that room
  const sessionMembers = new Map();

  io.on('connection', (socket) => {
    let currentSessionId = null;
    let displayName = 'Guest';

    socket.on('cobrowse:join', ({ sessionId, name }) => {
      if (!sessionId) return;

      const members = sessionMembers.get(sessionId) || new Set();
      if (members.size >= MAX_PARTICIPANTS_PER_SESSION) {
        socket.emit('cobrowse:full');
        return;
      }

      currentSessionId = sessionId;
      displayName = name || 'Guest';

      members.add(socket.id);
      sessionMembers.set(sessionId, members);

      socket.join(sessionId);
      socket.to(sessionId).emit('cobrowse:participant-joined', {
        id: socket.id,
        name: displayName,
      });

      socket.emit('cobrowse:joined', {
        participantCount: members.size,
      });
    });

    socket.on('cobrowse:cursor', ({ sessionId, xPercent, yPercent }) => {
      if (sessionId !== currentSessionId) return; // ignore spoofed session ids
      socket.to(sessionId).emit('cobrowse:cursor', {
        id: socket.id,
        name: displayName,
        xPercent,
        yPercent,
      });
    });

    socket.on('cobrowse:scroll', ({ sessionId, scrollPercent }) => {
      if (sessionId !== currentSessionId) return;
      socket.to(sessionId).emit('cobrowse:scroll', {
        id: socket.id,
        scrollPercent,
      });
    });

    socket.on('cobrowse:message', ({ sessionId, text }) => {
      if (sessionId !== currentSessionId || !text) return;
      const trimmed = String(text).slice(0, 500); // basic length cap
      io.to(sessionId).emit('cobrowse:message', {
        id: socket.id,
        name: displayName,
        text: trimmed,
        at: Date.now(),
      });
    });

    const leaveSession = () => {
      if (!currentSessionId) return;
      const members = sessionMembers.get(currentSessionId);
      if (members) {
        members.delete(socket.id);
        if (members.size === 0) {
          sessionMembers.delete(currentSessionId);
        }
      }
      socket.to(currentSessionId).emit('cobrowse:participant-left', {
        id: socket.id,
      });
    };

    socket.on('cobrowse:leave', leaveSession);
    socket.on('disconnect', leaveSession);
  });
};
