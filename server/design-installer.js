'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE = path.join(__dirname, 'public', 'alpha.template.html');
const TARGET = path.join(__dirname, 'public', 'alpha.html');
const PARTS = path.join(__dirname, 'assets', 'logo');

function install() {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const files = fs.readdirSync(PARTS).filter((name) => /^\d+\.txt$/.test(name)).sort();
  if (!files.length) throw new Error('OFFICIAL_LOGO_PARTS_MISSING');
  const logo = files.map((name) => fs.readFileSync(path.join(PARTS, name), 'utf8').trim()).join('');
  if (!logo.startsWith('iVBOR')) throw new Error('OFFICIAL_LOGO_INVALID');
  const output = template.replaceAll('__OFFICIAL_LOGO__', logo);
  const temp = `${TARGET}.tmp`;
  fs.writeFileSync(temp, output, 'utf8');
  fs.renameSync(temp, TARGET);
  return { ok: true, parts: files.length, size: output.length, target: TARGET };
}

module.exports = { install, TEMPLATE, TARGET, PARTS };
