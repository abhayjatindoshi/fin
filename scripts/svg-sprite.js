#!/usr/bin/env node
/**
 * Simple SVG sprite generator.
 * Usage:
 *   node scripts/svg-sprite.js output.svg https://example.com/icon1.svg https://example.com/icon2.svg
 * Or pass a file containing URLs (prefix with @):
 *   node scripts/svg-sprite.js output.svg @urls.txt
 *
 * Features:
 *  - Downloads each SVG via fetch
 *  - Strips XML/DOCTYPE, <svg> wrapper attributes except viewBox
 *  - Wraps inner markup in <symbol id="{derivedId}"> preserving viewBox
 *  - Merges all symbols into one <svg xmlns="http://www.w3.org/2000/svg"> sprite
 */

import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

async function fetchSvg(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    return await res.text();
}

function deriveId(url) {
    try {
        const u = new URL(url);
        const base = path.basename(u.pathname, '.svg');
        return base.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    } catch {
        return url.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().slice(0, 40);
    }
}

function extractViewBox(svg) {
    const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
    return m ? m[1] : null;
}

function stripSvgWrapper(svg) {
    // Remove xml declaration & doctype
    svg = svg.replace(/<\?xml[^>]*>/gi, '').replace(/<!DOCTYPE[^>]*>/gi, '');
    // Capture inner of first <svg ...>...</svg>
    const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (!match) return svg.trim();
    return match[1].trim();
}

function buildSymbol(id, viewBox, inner) {
    inner = inner.replaceAll(/fill="#20294C"/gi, 'fill="currentColor"');
    const vb = viewBox ? ` viewBox="${viewBox}"` : '';
    return `<symbol id="${id}"${vb}>\n${inner}\n</symbol>`;
}

async function main() {
    const categories = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
    const urls = [
        ...categories.INCOMING.flatMap(i => i.icons).map(i => i.icon),
        ...categories.OUTGOING.flatMap(i => i.icons).map(i => i.icon),
    ];
    const output = 'sprite.svg';
    const symbols = [];
    const iconNames = new Set();
    for (const url of urls) {
        try {
            console.log(`Downloading ${url}...`);
            const raw = await fetchSvg(url);
            const viewBox = extractViewBox(raw);
            const inner = stripSvgWrapper(raw);
            const id = deriveId(url);
            symbols.push(buildSymbol(id, viewBox, inner));
            iconNames.add(id);
            console.log(' done');
        } catch (e) {
            console.error(`\nError processing ${url}:`, e.message);
        }
    }
    const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;
    fs.writeFileSync(output, sprite, 'utf8');
    console.log(`Sprite written to ${output} (${symbols.length} symbols).`);
    console.log(`Icon names: ${JSON.stringify(Array.from(iconNames))}`);
}

main();
