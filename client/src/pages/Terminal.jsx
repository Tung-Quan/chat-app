import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import 'xterm/css/xterm.css';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const { socket } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!socket || !terminalRef.current) return;

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
      },
      allowProposedApi: true,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal in DOM
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Request terminal creation
    socket.emit('terminal:create');

    // Handle terminal ready
    socket.on('terminal:ready', () => {
      setIsConnected(true);
      term.writeln('\x1b[32mTerminal connected successfully!\x1b[0m');
    });

    // Handle terminal data
    socket.on('terminal:data', (data) => {
      term.write(data);
    });

    // Handle terminal error
    socket.on('terminal:error', (error) => {
      term.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m\r\n`);
    });

    // Handle user input
    term.onData((data) => {
      socket.emit('terminal:input', data);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal:resize', {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('terminal:ready');
      socket.off('terminal:data');
      socket.off('terminal:error');
      term.dispose();
    };
  }, [socket]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        if (socket) {
          socket.emit('terminal:resize', {
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          });
        }
      }
    }, 100);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Chat</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <h1 className="text-xl font-bold text-white">Server Terminal</h1>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 p-4">
        <div className="h-full bg-[#1e1e1e] rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          <div ref={terminalRef} className="h-full p-2" />
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <span>Connected to Debian 13 Server</span>
          <span className="text-xs">Use Ctrl+C to interrupt, Ctrl+D to exit</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
