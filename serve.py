#!/usr/bin/env python3
"""
serve.py - zero-dependency static file server for the Springdale ERP mock.

    python serve.py            # serves this folder on http://localhost:5173
    python serve.py 8080       # serves on a different port
    python serve.py --local    # bind loopback only (no LAN / tunnel access)

Binds all interfaces, dual-stack (IPv4 + IPv6), so VS Code dev tunnels, ngrok
and other machines on the LAN can reach it. Dev tunnels often resolve
"localhost" to IPv6 ::1, which a 127.0.0.1-only server refuses.

Standard library only. Works with Python 3.7+.
"""

import os
import sys
import gzip
import socket
import contextlib
import webbrowser
from email.utils import formatdate, parsedate_to_datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 5173


class Handler(SimpleHTTPRequestHandler):
    """Static handler with correct ES-module MIME types and no caching."""

    # HTTP/1.1 keep-alive. Tunnel relays (VS Code dev tunnels, ngrok) pool their
    # connections to the origin; under the default HTTP/1.0 the server closes
    # after every response, so any request the relay sends on a pooled socket
    # disappears and hangs until it times out. Every response below carries an
    # accurate Content-Length, which 1.1 requires.
    protocol_version = "HTTP/1.1"

    # Don't let idle keep-alive connections pin a thread forever.
    timeout = 30

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".map": "application/json",
        "": "application/octet-stream",
    }

    # Text assets worth compressing. db.js alone is ~219 KB raw, ~45 KB gzipped -
    # without this it times out through a dev tunnel or over a slow LAN.
    COMPRESSIBLE = {".js", ".mjs", ".css", ".html", ".htm", ".json", ".svg",
                    ".map", ".md", ".txt", ".csv"}
    MIN_COMPRESS_BYTES = 1024

    def end_headers(self):
        # "no-cache" = revalidate every time, but a 304 is allowed. Files still
        # stay fresh during development; repeat loads over a tunnel cost nothing.
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def _not_modified(self, mtime):
        ims = self.headers.get("If-Modified-Since")
        if not ims:
            return False
        with contextlib.suppress(Exception):
            return int(parsedate_to_datetime(ims).timestamp()) >= int(mtime)
        return False

    def do_GET(self):
        path = self.translate_path(self.path)
        ext = os.path.splitext(path)[1].lower()
        accepts_gzip = "gzip" in self.headers.get("Accept-Encoding", "")

        if not (os.path.isfile(path) and ext in self.COMPRESSIBLE):
            return super().do_GET()

        try:
            stat = os.stat(path)
            if self._not_modified(stat.st_mtime):
                self.send_response(304)
                self.send_header("Last-Modified", formatdate(stat.st_mtime, usegmt=True))
                self.end_headers()
                return
            with open(path, "rb") as handle:
                raw = handle.read()
        except OSError:
            return super().do_GET()

        use_gzip = accepts_gzip and len(raw) >= self.MIN_COMPRESS_BYTES
        body = gzip.compress(raw, 6) if use_gzip else raw

        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(path))
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Last-Modified", formatdate(stat.st_mtime, usegmt=True))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Keep the console quiet apart from errors.
        status = args[1] if len(args) > 1 else ""
        if str(status).startswith(("4", "5")):
            sys.stderr.write("  %s %s\n" % (self.address_string(), fmt % args))

    def send_error(self, code, message=None, explain=None):
        # Single-page app: unknown paths without a file extension fall back to index.html
        if code == 404 and "." not in os.path.basename(self.path.split("?")[0]):
            self.path = "/index.html"
            try:
                SimpleHTTPRequestHandler.do_GET(self)
                return
            except Exception:
                pass
        super().send_error(code, message, explain)


class DualStackServer(ThreadingHTTPServer):
    """Accepts IPv4 and IPv6 on the same socket so 'localhost' works either way."""

    address_family = socket.AF_INET6
    daemon_threads = True
    allow_reuse_address = True

    def server_bind(self):
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


class IPv4Server(ThreadingHTTPServer):
    address_family = socket.AF_INET
    daemon_threads = True
    allow_reuse_address = True


def find_port(start, host):
    family = socket.AF_INET6 if ":" in host else socket.AF_INET
    for port in range(start, start + 20):
        with socket.socket(family, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if family == socket.AF_INET6:
                with contextlib.suppress(Exception):
                    sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                continue
    return None


def lan_ip():
    """Best-effort outbound IP, for the 'other devices' URL. No traffic is sent."""
    with contextlib.suppress(Exception):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    return None


def main():
    requested = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            requested = int(sys.argv[1])
        except ValueError:
            pass

    local_only = "--local" in sys.argv
    host = "127.0.0.1" if local_only else "::"

    port = find_port(requested, host)
    if port is None and not local_only:
        # No usable IPv6 stack on this machine - fall back to IPv4 all-interfaces.
        host = "0.0.0.0"
        port = find_port(requested, host)
    if port is None:
        print("Could not find a free port between %d and %d." % (requested, requested + 19))
        sys.exit(1)

    url = "http://localhost:%d/" % port
    handler = partial(Handler, directory=ROOT)
    cls = IPv4Server if ":" not in host else DualStackServer
    server = cls((host, port), handler)

    print("")
    print("  Springdale ERP - mock UI")
    print("  ------------------------------------------")
    print("  Serving : %s" % ROOT)
    print("  Local   : %s" % url)
    if not local_only:
        ip = lan_ip()
        if ip:
            print("  Network : http://%s:%d/" % (ip, port))
        print("  Binding : all interfaces (%s) - forwardable / tunnellable" % host)
    else:
        print("  Binding : loopback only")
    print("  Stop    : press Ctrl+C")
    print("")

    if "--no-open" not in sys.argv:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.\n")
        server.server_close()


if __name__ == "__main__":
    main()
