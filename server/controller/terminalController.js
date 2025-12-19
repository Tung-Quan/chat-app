import { spawn } from 'node-pty';
import { io } from '../server.js';

// Store active terminal sessions
const terminalSessions = new Map();

export const setupTerminal = (socket) => {
  const sessionId = socket.id;
  
  socket.on('terminal:create', () => {
    try {
      // Use bash for Linux/Unix systems
      const shell = process.env.SHELL || '/bin/bash';
      
      // Spawn PTY process
      const ptyProcess = spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || '/root',
        env: process.env,
      });

      // Store session
      terminalSessions.set(sessionId, ptyProcess);

      // Send initial message
      ptyProcess.write('echo "*** Connected to Server Terminal ***"\r');

      // Handle process output
      ptyProcess.onData((data) => {
        socket.emit('terminal:data', data);
      });

      // Handle process exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        socket.emit('terminal:data', `\r\n*** Process exited with code ${exitCode} ***\r\n`);
        terminalSessions.delete(sessionId);
      });

      socket.emit('terminal:ready');
    } catch (error) {
      console.error('Error creating terminal:', error);
      socket.emit('terminal:error', error.message);
    }
  });

  // Handle input from client
  socket.on('terminal:input', (data) => {
    const ptyProcess = terminalSessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  // Handle terminal resize
  socket.on('terminal:resize', ({ cols, rows }) => {
    const ptyProcess = terminalSessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const ptyProcess = terminalSessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.kill();
      terminalSessions.delete(sessionId);
    }
  });
};
