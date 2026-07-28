#!/usr/bin/env sh

set -e

CERT_DIR="$(dirname "$0")/../nginx/certs"
mkdir -p "$CERT_DIR"

if [ -f "$CERT_DIR/cert.pem" ] && [ -f "$CERT_DIR/key.pem" ]; then
  echo "[certs] déjà présents dans nginx/certs/ — rien à faire."
  exit 0
fi

echo "[certs] auto signed contrat…"
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 825 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:matcha.local,IP:127.0.0.1"

echo "[certs] OK → nginx/certs/{cert,key}.pem"
