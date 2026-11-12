#!/usr/bin/env bash
# Converts original product photos to optimized WebP (max 900 px wide, like other products).
# Usage: scripts/optimize-product-images.sh <source-folder> <target-folder>
# Example: scripts/optimize-product-images.sh ~/Downloads/zimne-okna assets/products/zimne-okna
# Source files are processed in alphabetical order and saved as 01.webp, 02.webp, ...
set -euo pipefail
src="$1"; dst="$2"; mkdir -p "$dst"; i=1
for f in $(ls "$src" | sort -V); do
  case "${f,,}" in *.jpg|*.jpeg|*.png|*.webp) ;; *) continue ;; esac
  out=$(printf "%s/%02d.webp" "$dst" "$i")
  convert "$src/$f" -auto-orient -strip -resize '900x>' -quality 82 "$out"
  echo "$f -> $out"; i=$((i+1))
done
