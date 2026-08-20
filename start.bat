@echo off
setlocal enabledelayedexpansion
title Springdale ERP - Mock UI
cd /d "%~dp0"

echo.
echo   ============================================
echo     Springdale ERP - School Management Mock
echo   ============================================
echo.
echo   Starting a local web server on port 5173...
echo   (ES modules cannot run from file:// - a server is required)
echo.

REM ------------------------------------------------- find this PC's LAN IP
REM  Pinging our own hostname is the most reliable way to get the address the
REM  rest of the network actually sees, without parsing every ipconfig adapter.
set "LANIP="
for /f "tokens=2 delims=[]" %%a in ('ping -n 1 -4 "%COMPUTERNAME%" 2^>nul ^| findstr /c:"["') do set "LANIP=%%a"
if not defined LANIP (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
        if not defined LANIP (
            set "CAND=%%a"
            set "CAND=!CAND: =!"
            if not "!CAND:169.254=!"=="!CAND!" (rem link-local, skip) else set "LANIP=!CAND!"
        )
    )
)

if defined LANIP (
    echo   On this PC : http://localhost:5173
    echo   On a phone : http://!LANIP!:5173      ^(same Wi-Fi^)
) else (
    echo   On this PC : http://localhost:5173
)
echo.

REM ---------------------------------------------------------------- Python 3
REM  Note: serve.py opens the browser itself once the socket is bound, so it
REM  always points at the port it actually got (5173 may already be in use).
py -3 --version >nul 2>nul
if %errorlevel%==0 (
    echo   [1/4] Found the Python launcher - starting serve.py
    echo   Open: http://localhost:5173
    echo.
    py -3 "%~dp0serve.py"
    goto :ended
)

python --version >nul 2>nul
if %errorlevel%==0 (
    echo   [2/4] Found python - starting serve.py
    echo   Open: http://localhost:5173
    echo.
    python "%~dp0serve.py"
    goto :ended
)

REM ------------------------------------------------------------------- npx
where npx >nul 2>nul
if %errorlevel%==0 (
    echo   [3/4] Python not found - falling back to "npx serve"
    echo   Open: http://localhost:5173   ^(first run may take ~20s to download^)
    echo.
    start "" http://localhost:5173
    npx --yes serve -l 5173 "%~dp0"
    goto :ended
)

REM ------------------------------------------------------- node one-liner
where node >nul 2>nul
if %errorlevel%==0 (
    echo   [4/4] Using a built-in Node static server
    echo   Open: http://localhost:5173
    echo.
    start "" http://localhost:5173
    node -e "const http=require('http'),fs=require('fs'),p=require('path'),zlib=require('zlib'),os=require('os');const root=process.cwd();const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};const gz=new Set(['.html','.js','.mjs','.css','.json','.svg']);http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split('?')[0]);if(u==='/')u='/index.html';let f=p.join(root,u);if(!f.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}fs.readFile(f,(e,d)=>{if(e){if(!p.extname(u)){return fs.readFile(p.join(root,'index.html'),(e2,d2)=>{res.writeHead(e2?404:200,{'Content-Type':'text/html'});res.end(e2?'Not found':d2)})}res.writeHead(404);return res.end('Not found')}const ext=p.extname(f).toLowerCase();const h={'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-cache'};if(gz.has(ext)&&/gzip/.test(req.headers['accept-encoding']||'')&&d.length>1024){const b=zlib.gzipSync(d);h['Content-Encoding']='gzip';h['Vary']='Accept-Encoding';res.writeHead(200,h);return res.end(b)}res.writeHead(200,h);res.end(d)})}).listen(5173,()=>{const ips=[].concat(...Object.values(os.networkInterfaces())).filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address);console.log('  Local   : http://localhost:5173');ips.forEach(ip=>console.log('  Network : http://'+ip+':5173'));console.log('  Ctrl+C to stop')});"
    goto :ended
)

REM --------------------------------------------------------------- fallback
echo.
echo   ------------------------------------------------------------------
echo    Could not find Python, npx or Node on this machine.
echo.
echo    The app needs to be served over http:// because it uses ES modules.
echo    Pick any ONE of these options:
echo.
echo      1. Install Python 3 from https://python.org  then run:
echo             py -3 serve.py
echo.
echo      2. Install Node.js from https://nodejs.org  then run:
echo             npx serve -l 5173
echo.
echo      3. In VS Code, install the "Live Server" extension,
echo         right-click index.html and choose "Open with Live Server".
echo.
echo      4. Any other static server pointed at this folder works too.
echo.
echo    Then open:  http://localhost:5173
echo   ------------------------------------------------------------------
echo.
pause
goto :eof

:ended
echo.
echo   Server stopped.
pause
endlocal
