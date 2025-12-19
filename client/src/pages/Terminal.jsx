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

    // Inject proper monospace font for terminal (Roboto Mono)
    let fontLink = null;
    try {
      if (!document.querySelector('link[data-xterm-font]')) {
        fontLink = document.createElement('link');
        fontLink.setAttribute('rel', 'stylesheet');
        fontLink.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
        fontLink.setAttribute('data-xterm-font', 'true');
        document.head.appendChild(fontLink);
      } else {
        fontLink = document.querySelector('link[data-xterm-font]');
      }
    } catch (e) {
      console.error('Error injecting terminal font:', e);
    }

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      lineHeight: 1.4,
      letterSpacing: 0,
      fontFamily: '"Roboto Mono", "Courier New", monospace',
      fontWeight: '400',
      fontWeightBold: '700',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.18)',
      },
      allowProposedApi: true,
    });

    // Create fit addon and open terminal
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    // initial fit (font may not be loaded yet)
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Request terminal creation
    socket.emit('terminal:create');

    // Observe container size changes to keep terminal responsive
    const panel = terminalRef.current?.closest('.flex-1') || terminalRef.current?.parentElement;
    let resizeObserver;
    let resizeTimeout;
    const debouncedFit = () => {
      try {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          fitAddon.fit();
          socket.emit('terminal:resize', { cols: term.cols, rows: term.rows });
        }, 100);
      } catch (e) {
        console.error('debouncedFit error', e);
      }
    };

    try {
      if (panel && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(debouncedFit);
        resizeObserver.observe(panel);
      }
    } catch (e) {
      console.error('Error setting up ResizeObserver for terminal:', e);
    }

    // Ensure terminal re-fits and applies font after load
    const applyFontAndFit = () => {
      try {
        term.setOption('fontFamily', '"Roboto Mono", "Courier New", monospace');
        term.setOption('letterSpacing', 0);
        fitAddon.fit();
        socket.emit('terminal:resize', { cols: term.cols, rows: term.rows });
      } catch (e) {
        console.error('Error applying font:', e);
      }
    };

    try {
      if (fontLink) {
        fontLink.onload = () => setTimeout(applyFontAndFit, 50);
      }
      if (document && document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(applyFontAndFit, 50)).catch(() => {});
      }
      // Fallback delayed apply
      setTimeout(applyFontAndFit, 300);
    } catch (e) {
      console.error('Error handling font load for terminal:', e);
    }

    // Handle terminal ready
    socket.on('terminal:ready', () => {
      setIsConnected(true);
      term.writeln('\x1b[32mTerminal connected successfully!\x1b[0m');
    });

    // Helper to filter noisy echo lines from shell profile (e.g. Connected message)
    const filterTerminalData = (data) => {
      if (!data) return data;
      // Remove occurrences of the connected banner
      let filtered = data.replace(/\*{3}\s*Connected to Server Terminal\s*\*{3}/gi, '');
      // Remove explicit echo commands that print the same banner
      filtered = filtered.replace(/^\s*echo\s+["']?\*{3}.*Connected to Server Terminal.*\*{3}["']?\s*\r?\n?/gim, '');
      // Remove empty command errors (bash: : command not found)
      filtered = filtered.replace(/bash:\s*:\s*command not found\s*\r?\n?/gi, '');
      // Remove empty quotes "" that appear as commands
      filtered = filtered.replace(/^\s*[""'']\s*[""'']\s*\r?\n?/gm, '');
      // Remove standalone empty quotes on their own line
      filtered = filtered.replace(/^["'"]\s*\r?\n/gm, '');
      // Collapse multiple blank lines to a single newline
      filtered = filtered.replace(/(\r?\n){3,}/g, '\r\n\r\n');
      return filtered;
    };

    // Handle terminal data (filtered for readability)
    socket.on('terminal:data', (data) => {
      try {
        const out = filterTerminalData(data);
        if (out && out.length > 0) term.write(out);
      } catch (e) {
        term.write(data);
        console.error("Error writing terminal data:", e);
      }
    });

    // Handle terminal error
    socket.on('terminal:error', (error) => {
      term.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m\r\n`);
    });

    // Handle user input
    term.onData((data) => {
      // Prevent sending empty or whitespace-only input
      if (data && data.trim().length > 0) {
        socket.emit('terminal:input', data);
      } else if (data === '\r' || data === '\n') {
        // Allow Enter key
        socket.emit('terminal:input', data);
      }
    });

    // Handle window resize
    const handleResize = () => debouncedFit();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      try { if (resizeObserver) resizeObserver.disconnect(); } catch(e) {
        console.error('Error disconnecting ResizeObserver:', e);
      }
      try { clearTimeout(resizeTimeout); } catch(e) {
        console.error('Error clearing resize timeout:', e);
      }
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
          <div className="h-full p-2">
            <div ref={terminalRef} className="w-full h-full" />
          </div>
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
